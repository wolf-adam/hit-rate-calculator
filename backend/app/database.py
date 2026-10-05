import os
from collections.abc import Generator

from dotenv import load_dotenv
from sqlalchemy import create_engine, inspect, select, text
from sqlalchemy.orm import Session, sessionmaker

from .card_utils import card_name_from_link, normalize_card_link
from .models import Base, Card, CardSet, Player, Product, Record

load_dotenv()

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg://postgres:postgres@localhost:5432/hit_rate_calculator",
)
engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


def get_db() -> Generator[Session, None, None]:
    with SessionLocal() as session:
        yield session


def initialize_database() -> None:
    """Create missing tables, including the current records table."""
    Base.metadata.create_all(bind=engine)
    normalize_card_names()
    migrate_v1_records_to_v2()
    remove_record_card_metadata_columns()


def migrate_v1_records_to_v2() -> None:
    """Copy legacy records into v2 using the current foreign-key tables."""
    inspector = inspect(engine)
    if not inspector.has_table("hit_rate_records"):
        return

    legacy_columns = {
        column["name"] for column in inspector.get_columns("hit_rate_records")
    }
    required_columns = {
        "id",
        "date_created",
        "set_id",
        "player_id",
        "in_product_id",
        "ex",
        "ir",
        "sir",
        "fr",
        "hr",
        "cc",
        "biggest_hit_link",
        "biggest_hit_src",
        "price",
    }
    missing_columns = required_columns - legacy_columns
    if missing_columns:
        raise RuntimeError(
            "Cannot migrate hit_rate_records: missing columns "
            + ", ".join(sorted(missing_columns))
        )

    with SessionLocal() as session:
        existing_ids = set(session.scalars(select(Record.id)))
        legacy_records = session.execute(
            text("SELECT * FROM hit_rate_records ORDER BY id")
        ).mappings()

        for legacy in legacy_records:
            record_id = int(legacy["id"])
            if record_id in existing_ids:
                continue

            card = None
            legacy_card_id = legacy.get("card_id")
            if legacy_card_id is not None:
                card = session.get(Card, int(legacy_card_id))

            normalized_link = normalize_card_link(legacy["biggest_hit_link"])
            if card is None:
                card = session.scalar(
                    select(Card).where(
                        (Card.link == normalized_link)
                        | (Card.name == card_name_from_link(normalized_link))
                    )
                )
            if card is None:
                card = Card(
                    name=card_name_from_link(normalized_link),
                    link=normalized_link,
                    image_src=legacy["biggest_hit_src"] or normalized_link,
                    price=legacy["price"],
                )
                session.add(card)
                session.flush()

            for model, field in (
                (CardSet, "set_id"),
                (Player, "player_id"),
                (Product, "in_product_id"),
            ):
                if session.get(model, int(legacy[field])) is None:
                    raise RuntimeError(
                        f"Cannot migrate hit_rate_records row {record_id}: "
                        f"{field}={legacy[field]} does not exist."
                    )

            session.add(
                Record(
                    id=record_id,
                    date_created=legacy["date_created"],
                    set_id=int(legacy["set_id"]),
                    player_id=int(legacy["player_id"]),
                    ex=int(legacy["ex"]),
                    ir=int(legacy["ir"]),
                    sir=int(legacy["sir"]),
                    fr=int(legacy["fr"]),
                    hr=int(legacy["hr"]),
                    cc=int(legacy["cc"]),
                    card_id=card.id,
                    in_product_id=int(legacy["in_product_id"]),
                )
            )
            existing_ids.add(record_id)

        session.commit()

    with engine.begin() as connection:
        connection.execute(
            text(
                "SELECT setval("
                "pg_get_serial_sequence('hit_rate_records_v2', 'id'), "
                "COALESCE(MAX(id), 1), MAX(id) IS NOT NULL) "
                "FROM hit_rate_records_v2"
            )
        )


def remove_record_card_metadata_columns() -> None:
    """Remove duplicated card metadata from the current records table."""
    with engine.begin() as connection:
        columns = {
            column["name"]
            for column in inspect(connection).get_columns("hit_rate_records_v2")
        }
        removable_columns = {
            "biggest_hit_link",
            "biggest_hit_src",
            "price",
        } & columns
        for column in removable_columns:
            connection.execute(
                text(f'ALTER TABLE hit_rate_records_v2 DROP COLUMN "{column}"')
            )


def normalize_card_names() -> None:
    """Bring stored card names in line with the canonical link formatter."""
    with SessionLocal() as session:
        cards = session.scalars(select(Card)).all()
        changed = False
        for card in cards:
            canonical_name = card_name_from_link(card.link)
            if card.name != canonical_name:
                card.name = canonical_name
                changed = True
        if changed:
            session.commit()
