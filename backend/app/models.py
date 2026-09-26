from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, ForeignKey, Numeric, String
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class CardSet(Base):
    __tablename__ = "hit_rate_sets"

    id: Mapped[int] = mapped_column(primary_key=True)
    short_name: Mapped[str] = mapped_column(String(120), unique=True, nullable=False)
    long_name: Mapped[str] = mapped_column(String(240), nullable=False)
    ex: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    ir: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    sir: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    fr: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    hr: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    cc: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)

class Player(Base):
    __tablename__ = "hit_rate_players"

    id: Mapped[int] = mapped_column(primary_key=True)
    first_name: Mapped[str] = mapped_column(String(120), unique=True, nullable=False)
    last_name: Mapped[str] = mapped_column(String(240), nullable=False)

class Product(Base):
    __tablename__ = "hit_rate_products"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(240), nullable=False)
    booster_volume: Mapped[int] = mapped_column(nullable=False)


class Card(Base):
    __tablename__ = "hit_rate_cards"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(240), unique=True, nullable=False)
    link: Mapped[str] = mapped_column(String(500), unique=True, nullable=False)
    image_src: Mapped[str] = mapped_column(String(500), nullable=False)
    price: Mapped[Decimal] = mapped_column(
        Numeric(10, 2), default=0.0, nullable=False
    )

class Record(Base):
    __tablename__ = "hit_rate_records"

    id: Mapped[int] = mapped_column(primary_key=True)
    date_created: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    set_id: Mapped[int] = mapped_column(
        ForeignKey("hit_rate_sets.id"), nullable=False, index=True
    )
    player_id: Mapped[int] = mapped_column(
        ForeignKey("hit_rate_players.id"), nullable=False, index=True
    )
    ex: Mapped[int] = mapped_column(default=0, nullable=False)
    ir: Mapped[int] = mapped_column(default=0, nullable=False)
    sir: Mapped[int] = mapped_column(default=0, nullable=False)
    fr: Mapped[int] = mapped_column(default=0, nullable=False)
    hr: Mapped[int] = mapped_column(default=0, nullable=False)
    cc: Mapped[int] = mapped_column(default=0, nullable=False)
    biggest_hit_link: Mapped[str] = mapped_column(String(500), nullable=False)
    biggest_hit_src: Mapped[str | None] = mapped_column(String(500))
    card_id: Mapped[int | None] = mapped_column(
        ForeignKey("hit_rate_cards.id"), index=True
    )
    in_product_id: Mapped[int] = mapped_column(
        ForeignKey("hit_rate_products.id"), nullable=False, index=True
    )
    price: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=0.0, nullable=False)

    player: Mapped[Player] = relationship()
    set: Mapped[CardSet] = relationship()
    product: Mapped[Product] = relationship()
    in_product: Mapped[Product] = relationship()
    card: Mapped[Card | None] = relationship()
