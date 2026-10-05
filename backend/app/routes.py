from decimal import Decimal

import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from .card_utils import card_name_from_link, normalize_card_link
from .database import get_db
from .models import Card, CardSet, Player, Product, Record
from .schemas import (
    CardCreate,
    CardResponse,
    CardUpdate,
    PlayerCreate,
    PlayerResponse,
    ProductAnalyticsResponse,
    ProductResponse,
    RecordCreate,
    RecordItemResponse,
    RecordResponse,
    RecordUpdate,
    SetResponse,
)

router = APIRouter()


def resolve_card(
    db: Session,
    link: str,
    image_src: str | None,
    price: Decimal,
    name: str | None = None,
) -> Card:
    normalized_link = normalize_card_link(link)
    card = db.scalar(select(Card).where(Card.link == normalized_link))
    if card is not None:
        canonical_name = card_name_from_link(normalized_link)
        if card.name != canonical_name:
            card.name = canonical_name
        return card

    card = Card(
        name=name or card_name_from_link(normalized_link),
        link=normalized_link,
        image_src=image_src or normalized_link,
        price=price,
    )
    db.add(card)
    db.flush()
    return card


@router.get("/cards/lookup", response_model=CardResponse, tags=["Cards"])
def lookup_card(
    name: str = Query(..., min_length=1), db: Session = Depends(get_db)
) -> Card:
    card = db.scalar(
        select(Card).where(func.lower(Card.name) == name.strip().lower())
    )
    if card is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Card not found"
        )
    return card


@router.get("/cards", response_model=list[CardResponse], tags=["Cards"])
def get_cards(db: Session = Depends(get_db)) -> list[Card]:
    return list(db.scalars(select(Card).order_by(Card.name.asc())))


@router.post(
    "/cards",
    response_model=CardResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Cards"],
)
def create_card(
    payload: CardCreate,
    db: Session = Depends(get_db),
) -> Card:
    normalized_link = normalize_card_link(payload.link)
    existing = db.scalar(
        select(Card).where(
            (Card.link == normalized_link)
            | (func.lower(Card.name) == payload.name.strip().lower())
        )
    )
    if existing is not None:
        existing.name = payload.name.strip()
        existing.link = normalized_link
        existing.image_src = payload.image_src
        existing.price = payload.price
        db.commit()
        db.refresh(existing)
        return existing

    card = Card(
        name=card_name_from_link(normalized_link),
        link=normalized_link,
        image_src=payload.image_src,
        price=payload.price,
    )
    db.add(card)
    db.commit()
    db.refresh(card)
    return card


@router.put("/cards/{card_id}", response_model=CardResponse, tags=["Cards"])
def update_card(
    card_id: int,
    payload: CardUpdate,
    db: Session = Depends(get_db),
) -> Card:
    card = db.get(Card, card_id)
    if card is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Card not found"
        )
    card.name = payload.name
    card.link = normalize_card_link(payload.link)
    card.image_src = payload.image_src
    card.price = payload.price
    db.commit()
    db.refresh(card)
    return card

@router.get("/sets", response_model=list[SetResponse], tags=["Catalog"])
def get_sets(db: Session = Depends(get_db)) -> list[CardSet]:
    return list(db.scalars(select(CardSet).order_by(CardSet.id.asc())))


@router.get("/players", response_model=list[PlayerResponse], tags=["Catalog"])
def get_players(db: Session = Depends(get_db)) -> list[PlayerResponse]:
    players = db.scalars(select(Player).order_by(Player.first_name, Player.last_name))
    return [
        PlayerResponse(id=player.id, name=f"{player.first_name} {player.last_name}")
        for player in players
    ]


@router.post(
    "/players",
    response_model=PlayerResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Catalog"],
)
def create_player(
    payload: PlayerCreate,
    db: Session = Depends(get_db),
) -> PlayerResponse:
    existing = db.scalar(
        select(Player).where(
            func.lower(Player.first_name) == payload.first_name.lower()
        )
    )
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A player with this first name already exists.",
        )

    player = Player(first_name=payload.first_name, last_name=payload.last_name)
    db.add(player)
    db.commit()
    db.refresh(player)
    return PlayerResponse(
        id=player.id,
        name=f"{player.first_name} {player.last_name}",
    )


@router.get("/products", response_model=list[ProductResponse], tags=["Catalog"])
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
                "card_id": record.card_id,
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
                biggest_hit_link=top_record["biggest_hit_link"],
                biggest_hit_src=top_record["biggest_hit_src"],
                card_id=int(top_record["card_id"])
                if pd.notna(top_record["card_id"])
                else None,
                in_product_id=int(top_record["in_product_id"]),
                price=Decimal(top_record["price"]),
                total=total,
                items=items_by_player[int(player_id)],
            )
        )
    return responses

@router.get("/records", response_model=list[RecordResponse], tags=["Records"])
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
            .outerjoin(Card, Record.card_id == Card.id)
            .order_by(Record.player_id, Card.price.desc().nullslast())
        )
    )
    if not records:
        return []

    return aggregate_records(records, card_set, product_set)


@router.get("/records/modal", response_model=list[RecordResponse], tags=["Records"])
def get_records_for_modal(
    set_id: int = Query(..., gt=0), db: Session = Depends(get_db)
) -> list[RecordResponse]:
    return get_records(set_id, db)


@router.get(
    "/product-analytics",
    response_model=list[ProductAnalyticsResponse],
    tags=["Analytics"],
)
def get_product_analytics(
    set_id: int = Query(..., gt=0), db: Session = Depends(get_db)
) -> list[ProductAnalyticsResponse]:
    if db.get(CardSet, set_id) is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Set not found"
        )

    records = list(
        db.scalars(
            select(Record)
            .join(Product, Record.in_product_id == Product.id)
            .where(Record.set_id == set_id)
            .order_by(Product.booster_volume.asc(), Product.name.asc(), Record.id.asc())
        )
    )
    products = {record.in_product.id: record.in_product for record in records}
    grouped: dict[int, list[Record]] = {}
    for record in records:
        grouped.setdefault(record.in_product_id, []).append(record)

    responses: list[ProductAnalyticsResponse] = []
    rarity_fields = ("ex", "ir", "sir", "fr", "hr", "cc")
    for product_id, product_records in grouped.items():
        product = products[product_id]
        counts = {
            field: sum(getattr(record, field) for record in product_records)
            for field in rarity_fields
        }
        opening_count = len(product_records)
        total_boosters = opening_count * product.booster_volume
        total_hits = sum(counts.values())
        no_hit_boosters = max(total_boosters - total_hits, 0)
        def rate(value: int) -> float:
            return value / total_boosters * 100 if total_boosters else 0.0
        responses.append(
            ProductAnalyticsResponse(
                id=product.id,
                name=product.name,
                booster_volume=product.booster_volume,
                opening_count=opening_count,
                total_boosters=total_boosters,
                **counts,
                rarity_rates={field: rate(counts[field]) for field in rarity_fields},
                total_hits=total_hits,
                no_hit_boosters=no_hit_boosters,
                hit_rate=rate(total_hits),
                no_hit_rate=rate(no_hit_boosters),
                one_in_x=total_boosters / total_hits if total_hits else None,
            )
        )
    return responses


@router.put(
    "/records/{record_id}",
    response_model=RecordItemResponse,
    tags=["Records"],
)
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

    card = db.get(Card, payload.card_id) if payload.card_id else record.card
    if payload.card_id and card is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Card not found"
        )

    update_values = payload.model_dump(
        exclude={
            "card_id",
            "biggest_hit_link",
            "biggest_hit_src",
            "price",
        }
    )
    if card is not None:
        update_values["card_id"] = card.id
    for field, value in update_values.items():
        setattr(record, field, value)
    db.commit()
    db.refresh(record)
    return record

@router.post(
    "/records",
    response_model=RecordResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Records"],
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

    card = db.get(Card, payload.card_id) if payload.card_id else None
    if payload.card_id and card is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Card not found"
        )
    if card is None and payload.biggest_hit_link:
        card = resolve_card(
            db,
            payload.biggest_hit_link,
            payload.biggest_hit_src,
            payload.price,
        )

    record_data = payload.model_dump(
        exclude={
            "card_id",
            "biggest_hit_link",
            "biggest_hit_src",
            "price",
        }
    )
    record_data["card_id"] = card.id if card is not None else None
    record = Record(**record_data)
    db.add(record)
    db.commit()
    records = list(
        db.scalars(
            select(Record)
            .where(
                Record.set_id == payload.set_id,
                Record.player_id == payload.player_id,
            )
            .outerjoin(Card, Record.card_id == Card.id)
            .order_by(Card.price.desc().nullslast())
        )
    )
    product_set = list(db.scalars(select(Product)))
    return next(
        row
        for row in aggregate_records(records, card_set, product_set)
        if row.id == payload.player_id
    )
