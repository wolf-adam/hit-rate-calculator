import os
from collections.abc import Generator

from dotenv import load_dotenv
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session, sessionmaker

from .card_utils import card_name_from_link
from .models import Base, Card

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
