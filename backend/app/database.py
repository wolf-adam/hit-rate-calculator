import os
from collections.abc import Generator

from dotenv import load_dotenv
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import Session, sessionmaker

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
    """Create missing tables and apply the product-column compatibility migration."""
    Base.metadata.create_all(bind=engine)
    migrate_record_product_column()


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
