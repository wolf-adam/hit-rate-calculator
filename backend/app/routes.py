from decimal import Decimal

import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from .database import get_db
from .models import CardSet, Player, Product, Record
from .schemas import (
    PlayerResponse,
    ProductResponse,
    RecordCreate,
    RecordItemResponse,
    RecordResponse,
    RecordUpdate,
    SetResponse,
)

router = APIRouter()

@router.get("/sets", response_model=list[SetResponse])
def get_sets(db: Session = Depends(get_db)) -> list[CardSet]:
    return list(db.scalars(select(CardSet).order_by(CardSet.id.asc())))


@router.get("/players", response_model=list[PlayerResponse])
def get_players(db: Session = Depends(get_db)) -> list[PlayerResponse]:
    players = db.scalars(select(Player).order_by(Player.first_name, Player.last_name))
    return [
        PlayerResponse(id=player.id, name=f"{player.first_name} {player.last_name}")
        for player in players
    ]


@router.get("/products", response_model=list[ProductResponse])
def get_products(db: Session = Depends(get_db)) -> list[ProductResponse]:
    products = db.scalars(
        select(Product).order_by(Product.booster_volume.asc(), Product.name.asc())
    )
    return [ProductResponse(id=product.id, name=product.name) for product in products]


def aggregate_records(
    records: list[Record],
    card_set: CardSet,
    product_set: list[Product],
) -> list[RecordResponse]:
    frame = pd.DataFrame(
        [
            {
                "player_id": record.player_id,
                "name": f"{record.player.first_name} {record.player.last_name}",
                "ex": Decimal(record.ex),
                "ir": Decimal(record.ir),
                "sir": Decimal(record.sir),
                "cc": Decimal(record.cc),
                "fr": Decimal(record.fr),
                "hr": Decimal(record.hr),
                "biggest_hit_link": record.biggest_hit_link,
                "biggest_hit_src": record.biggest_hit_src,
                "in_product_id": record.in_product_id,
                "price": Decimal(record.price),
            }
            for record in records
        ]
    )
    frame = frame.sort_values(
        ["player_id", "price"], ascending=[True, False], kind="stable"
    )
    grouped = frame.groupby(["player_id", "name"], sort=False)
    product_volumes = {
        product.id: product.booster_volume for product in product_set
    }
    responses: list[RecordResponse] = []
    items_by_player: dict[int, list[RecordItemResponse]] = {}
    for record in records:
        items_by_player.setdefault(record.player_id, []).append(
            RecordItemResponse.model_validate(record)
        )

    weights = {
        "ex": card_set.ex,
        "ir": card_set.ir,
        "sir": card_set.sir,
        "fr": card_set.fr,
        "hr": card_set.hr,
        "cc": card_set.cc,
    }

    for (player_id, name), player_frame in grouped:
        rarity_totals = {
            field: Decimal(player_frame[field].sum())
            for field in ("ex", "ir", "sir", "cc", "fr", "hr")
        }
        top_record = player_frame.iloc[0]
        total = sum(
            (rarity_totals[field] * Decimal(weights[field]) for field in rarity_totals),
            Decimal("0"),
        )
        total_boosters = sum(
            product_volumes[int(product_id)]
            for product_id in player_frame["in_product_id"]
        )
        responses.append(
            RecordResponse(
                id=int(player_id),
                name=str(name),
                **rarity_totals,
                total_boosters=total_boosters,
                biggest_hit_link=str(top_record["biggest_hit_link"]),
                biggest_hit_src=top_record["biggest_hit_src"],
                in_product_id=int(top_record["in_product_id"]),
                price=Decimal(top_record["price"]),
                total=total,
                items=items_by_player[int(player_id)],
            )
        )
    return responses

@router.get("/records", response_model=list[RecordResponse])
def get_records(
    set_id: int = Query(..., gt=0), db: Session = Depends(get_db)
) -> list[RecordResponse]:
    card_set = db.get(CardSet, set_id)
    product_set = list(
        db.scalars(
            select(Product)
        )
    )
    if card_set is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Set not found"
        )

    records = list(
        db.scalars(
            select(Record)
            .join(Player, Record.player_id == Player.id)
            .where(Record.set_id == set_id)
            .order_by(Record.player_id, Record.price.desc())
        )
    )
    if not records:
        return []

    return aggregate_records(records, card_set, product_set)


@router.put("/records/{record_id}", response_model=RecordItemResponse)
def update_record(
    record_id: int,
    payload: RecordUpdate,
    db: Session = Depends(get_db),
) -> Record:
    record = db.get(Record, record_id)
    if record is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Record not found"
        )
    if db.get(Product, payload.in_product_id) is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Product not found"
        )

    for field, value in payload.model_dump().items():
        setattr(record, field, value)
    db.commit()
    db.refresh(record)
    return record

@router.post(
    "/records", response_model=RecordResponse, status_code=status.HTTP_201_CREATED
)
def create_record(
    payload: RecordCreate, db: Session = Depends(get_db)
) -> RecordResponse:
    card_set = db.get(CardSet, payload.set_id)
    if card_set is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Set not found"
        )
    if db.get(Player, payload.player_id) is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Player not found"
        )
    if db.get(Product, payload.in_product_id) is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Product not found"
        )

    record = Record(**payload.model_dump())
    db.add(record)
    db.commit()
    records = list(
        db.scalars(
            select(Record)
            .where(
                Record.set_id == payload.set_id,
                Record.player_id == payload.player_id,
            )
            .order_by(Record.price.desc())
        )
    )
    product_set = list(db.scalars(select(Product)))
    return next(
        row
        for row in aggregate_records(records, card_set, product_set)
        if row.id == payload.player_id
    )
