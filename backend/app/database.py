import os
from collections.abc import Generator

from dotenv import load_dotenv
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import Session, sessionmaker

from .card_utils import card_name_from_link, normalize_card_link
from .models import Base

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
    """Create missing tables and apply compatibility migrations."""
    Base.metadata.create_all(bind=engine)
    migrate_record_product_column()
    migrate_record_card_data()


def migrate_record_product_column() -> None:
    """Add the product foreign key to databases created before products were added."""
    with engine.begin() as connection:
        columns = {
            column["name"]
            for column in inspect(connection).get_columns("hit_rate_records")
        }
        if "in_product_id" in columns:
            return

        connection.execute(
            text(
                "ALTER TABLE hit_rate_records "
                "ADD COLUMN in_product_id INTEGER"
            )
        )
        connection.execute(
            text(
                "UPDATE hit_rate_records "
                "SET in_product_id = ("
                "SELECT id FROM hit_rate_products ORDER BY id LIMIT 1"
                ") WHERE in_product_id IS NULL"
            )
        )
        remaining = connection.scalar(
            text(
                "SELECT COUNT(*) FROM hit_rate_records "
                "WHERE in_product_id IS NULL"
            )
        )
        if remaining:
            raise RuntimeError(
                "Cannot migrate hit_rate_records: no product exists for legacy records."
            )

        connection.execute(
            text(
                "ALTER TABLE hit_rate_records "
                "ALTER COLUMN in_product_id SET NOT NULL"
            )
        )
        connection.execute(
            text(
                "ALTER TABLE hit_rate_records "
                "ADD CONSTRAINT hit_rate_records_product_fk "
                "FOREIGN KEY (in_product_id) REFERENCES hit_rate_products (id)"
            )
        )
        connection.execute(
            text(
                "CREATE INDEX IF NOT EXISTS ix_hit_rate_records_in_product_id "
                "ON hit_rate_records (in_product_id)"
            )
        )


def migrate_record_card_data() -> None:
    """Create cards and link existing records to their canonical metadata."""
    with engine.begin() as connection:
        record_columns = {
            column["name"]
            for column in inspect(connection).get_columns("hit_rate_records")
        }
        if "card_id" not in record_columns:
            connection.execute(
                text(
                    "ALTER TABLE hit_rate_records "
                    "ADD COLUMN card_id INTEGER"
                )
            )
            connection.execute(
                text(
                    "CREATE INDEX IF NOT EXISTS ix_hit_rate_records_card_id "
                    "ON hit_rate_records (card_id)"
                )
            )

        records = connection.execute(
            text(
                "SELECT id, biggest_hit_link, biggest_hit_src, price "
                "FROM hit_rate_records "
                "ORDER BY date_created DESC, id DESC"
            )
        ).mappings()

        cards_by_link: dict[str, int] = {}
        for record in records:
            normalized_link = normalize_card_link(record["biggest_hit_link"])
            card_id = cards_by_link.get(normalized_link)
            if card_id is None:
                existing = connection.execute(
                    text(
                        "SELECT id, name FROM hit_rate_cards "
                        "WHERE link = :link OR name = :name "
                        "ORDER BY id LIMIT 1"
                    ),
                    {
                        "link": normalized_link,
                        "name": card_name_from_link(normalized_link),
                    },
                ).mappings().first()
                if existing is not None:
                    card_id = int(existing["id"])
                else:
                    name = card_name_from_link(normalized_link)
                    connection.execute(
                        text(
                            "INSERT INTO hit_rate_cards "
                            "(name, link, image_src, price) "
                            "VALUES (:name, :link, :image_src, :price)"
                        ),
                        {
                            "name": name,
                            "link": normalized_link,
                            "image_src": record["biggest_hit_src"]
                            or normalized_link,
                            "price": record["price"],
                        },
                    )
                    card_id = int(
                        connection.scalar(
                            text(
                                "SELECT id FROM hit_rate_cards WHERE link = :link"
                            ),
                            {"link": normalized_link},
                        )
                    )
                cards_by_link[normalized_link] = card_id

            connection.execute(
                text(
                    "UPDATE hit_rate_records SET card_id = :card_id "
                    "WHERE id = :record_id AND card_id IS NULL"
                ),
                {"card_id": card_id, "record_id": record["id"]},
            )

        remaining = connection.scalar(
            text(
                "SELECT COUNT(*) FROM hit_rate_records "
                "WHERE card_id IS NULL"
            )
        )
        if remaining:
            raise RuntimeError(
                "Cannot migrate hit_rate_records: card metadata is incomplete."
            )
