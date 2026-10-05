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
    migrate_card_name_identity()
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
                    select(Card).where(Card.link == normalized_link)
                )
            if card is None:
                card = session.scalar(
                    select(Card).where(
                        Card.name == card_name_from_link(normalized_link)
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
    """Canonicalize names and merge variants that resolve to one card name."""
    with SessionLocal() as session:
        cards = session.scalars(select(Card).order_by(Card.id)).all()
        canonical_cards: dict[str, Card] = {}
        for card in cards:
            canonical_name = card_name_from_link(card.link)
            survivor = canonical_cards.get(canonical_name)
            if survivor is None:
                canonical_cards[canonical_name] = card
                card.name = canonical_name
                continue

            session.query(Record).filter(Record.card_id == card.id).update(
                {Record.card_id: survivor.id}, synchronize_session=False
            )
            session.delete(card)
        session.commit()


def migrate_card_name_identity() -> None:
    """Restore unique canonical names after merging duplicate card variants."""
    if engine.dialect.name == "sqlite":
        has_name_uniqueness = _sqlite_cards_have_unique_name()
        with SessionLocal() as session:
            cards = session.scalars(select(Card).order_by(Card.id)).all()
            canonical_names = [card_name_from_link(card.link) for card in cards]
            already_migrated = (
                has_name_uniqueness
                and all(card.name == name for card, name in zip(cards, canonical_names))
                and len(set(canonical_names)) == len(canonical_names)
            )
        if already_migrated:
            return
        if has_name_uniqueness:
            _rebuild_sqlite_cards_table(unique_name=False)
        normalize_card_names()
        _rebuild_sqlite_cards_table(unique_name=True)
        return

    if engine.dialect.name == "postgresql":
        unique_constraints = inspect(engine).get_unique_constraints(
            "hit_rate_cards"
        )
        name_constraint = next(
            (
                constraint
                for constraint in unique_constraints
                if constraint.get("column_names") == ["name"]
            ),
            None,
        )
        if name_constraint is not None:
            constraint_name = name_constraint.get("name")
            if not constraint_name:
                raise RuntimeError(
                    "Card name uniqueness constraint has no database name."
                )
            quote = engine.dialect.identifier_preparer.quote
            with engine.begin() as connection:
                connection.execute(
                    text(
                        "ALTER TABLE hit_rate_cards DROP CONSTRAINT "
                        f"{quote(constraint_name)}"
                    )
                )
        normalize_card_names()
        with engine.begin() as connection:
            connection.execute(
                text(
                    "ALTER TABLE hit_rate_cards "
                    "ADD CONSTRAINT uq_hit_rate_cards_name UNIQUE (name)"
                )
            )
        return

    raise RuntimeError(
        "Cannot migrate card name uniqueness for database "
        f"dialect {engine.dialect.name!r}."
    )


def _sqlite_cards_have_unique_name() -> bool:
    with engine.connect() as connection:
        quote = engine.dialect.identifier_preparer.quote
        indexes = connection.exec_driver_sql(
            "PRAGMA index_list('hit_rate_cards')"
        ).mappings()
        return any(
            index["unique"]
            and [
                column["name"]
                for column in connection.exec_driver_sql(
                    f"PRAGMA index_info({quote(index['name'])})"
                ).mappings()
            ]
            == ["name"]
            for index in indexes
        )


def _rebuild_sqlite_cards_table(unique_name: bool) -> None:
    name_constraint = "UNIQUE" if unique_name else ""
    with engine.connect() as connection:
        connection.exec_driver_sql("PRAGMA foreign_keys=OFF")
        connection.commit()
        try:
            with connection.begin():
                connection.exec_driver_sql(
                    "DROP TABLE IF EXISTS hit_rate_cards_migration"
                )
                connection.exec_driver_sql(
                    "CREATE TABLE hit_rate_cards_migration ("
                    "id INTEGER NOT NULL PRIMARY KEY, "
                    f"name VARCHAR(240) NOT NULL {name_constraint}, "
                    "link VARCHAR(500) NOT NULL UNIQUE, "
                    "image_src VARCHAR(500) NOT NULL, "
                    "price NUMERIC(10, 2) DEFAULT 0.0 NOT NULL)"
                )
                connection.exec_driver_sql(
                    "INSERT INTO hit_rate_cards_migration "
                    "(id, name, link, image_src, price) "
                    "SELECT id, name, link, image_src, price "
                    "FROM hit_rate_cards"
                )
                connection.exec_driver_sql("DROP TABLE hit_rate_cards")
                connection.exec_driver_sql(
                    "ALTER TABLE hit_rate_cards_migration RENAME TO hit_rate_cards"
                )
        finally:
            connection.exec_driver_sql("PRAGMA foreign_keys=ON")
            connection.commit()
