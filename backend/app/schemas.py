from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class SetResponse(BaseModel):
    id: int
    short_name: str
    long_name: str
    ex: float
    ir: float
    sir: float
    cc: float = 0
    fr: float = 0
    hr: float = 0

    model_config = ConfigDict(from_attributes=True)


class PlayerResponse(BaseModel):
    id: int
    name: str


class ProductResponse(BaseModel):
    id: int
    name: str


class ProductAnalyticsResponse(BaseModel):
    id: int
    name: str
    booster_volume: int
    opening_count: int
    total_boosters: int
    ex: int
    ir: int
    sir: int
    fr: int
    hr: int
    cc: int
    rarity_rates: dict[str, float]
    total_hits: int
    no_hit_boosters: int
    hit_rate: float
    no_hit_rate: float
    one_in_x: float | None = None


class CardResponse(BaseModel):
    id: int
    name: str = Field(min_length=1, max_length=240)
    link: str = Field(min_length=1, max_length=500)
    image_src: str = Field(min_length=1, max_length=500)
    price: Decimal = Field(default=0, ge=0)

    model_config = ConfigDict(from_attributes=True)


class CardCreate(BaseModel):
    name: str = Field(min_length=1, max_length=240)
    link: str = Field(min_length=1, max_length=500)
    image_src: str = Field(min_length=1, max_length=500)
    price: Decimal = Field(ge=0)


class CardUpdate(CardCreate):
    pass


class RecordCreate(BaseModel):
    date_created: datetime
    set_id: int = Field(gt=0)
    player_id: int = Field(gt=0)
    in_product_id: int = Field(gt=0)
    ex: int = 0
    ir: int = 0
    sir: int = 0
    cc: int = 0
    fr: int = 0
    hr: int = 0
    card_id: int | None = Field(default=None, gt=0)
    biggest_hit_link: str | None = Field(default=None, max_length=500)
    biggest_hit_src: str | None = Field(default=None, max_length=500)
    price: Decimal = Field(ge=0)


class RecordUpdate(BaseModel):
    card_id: int | None = Field(default=None, gt=0)
    in_product_id: int = Field(gt=0)
    ex: int = Field(ge=0)
    ir: int = Field(ge=0)
    sir: int = Field(ge=0)
    cc: int = Field(ge=0)
    fr: int = Field(ge=0)
    hr: int = Field(ge=0)
    biggest_hit_link: str | None = Field(default=None, max_length=500)
    biggest_hit_src: str | None = Field(default=None, max_length=500)
    price: Decimal = Field(ge=0)


class RecordItemResponse(BaseModel):
    id: int
    card_id: int | None = None
    date_created: datetime
    in_product_id: int
    ex: int
    ir: int
    sir: int
    cc: int
    fr: int
    hr: int
    biggest_hit_link: str | None = Field(default=None, max_length=500)
    biggest_hit_src: str | None = None
    price: Decimal
    card: CardResponse | None = None

    model_config = ConfigDict(from_attributes=True)


class RecordResponse(BaseModel):
    id: int
    card_id: int | None = None
    name: str = Field(min_length=1, max_length=160)
    ex: int
    ir: int
    sir: int
    cc: int
    fr: int
    hr: int
    biggest_hit_link: str | None = Field(default=None, max_length=500)
    biggest_hit_src: str | None = None
    in_product_id: int = Field(gt=0)
    price: Decimal = Field(ge=0)
    total: Decimal
    total_boosters: int
    items: list[RecordItemResponse]
