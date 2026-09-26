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


class RecordCreate(BaseModel):
    date_created: datetime
    set_id: int = Field(gt=0)
    player_id: int = Field(gt=0)
    in_product_id: int = Field(gt=0)
    ex: int
    ir: int
    sir: int
    cc: int
    fr: int
    hr: int
    biggest_hit_link: str = Field(min_length=1, max_length=240)
    biggest_hit_src: str | None = Field(default=None, max_length=500)
    price: Decimal = Field(ge=0)


class RecordUpdate(BaseModel):
    in_product_id: int = Field(gt=0)
    ex: int = Field(ge=0)
    ir: int = Field(ge=0)
    sir: int = Field(ge=0)
    cc: int = Field(ge=0)
    fr: int = Field(ge=0)
    hr: int = Field(ge=0)
    biggest_hit_link: str = Field(min_length=1, max_length=240)
    biggest_hit_src: str | None = Field(default=None, max_length=500)
    price: Decimal = Field(ge=0)


class RecordItemResponse(BaseModel):
    id: int
    date_created: datetime
    in_product_id: int
    ex: int
    ir: int
    sir: int
    cc: int
    fr: int
    hr: int
    biggest_hit_link: str
    biggest_hit_src: str | None = None
    price: Decimal

    model_config = ConfigDict(from_attributes=True)


class RecordResponse(BaseModel):
    id: int
    name: str = Field(min_length=1, max_length=160)
    ex: int
    ir: int
    sir: int
    cc: int
    fr: int
    hr: int
    biggest_hit_link: str = Field(min_length=1, max_length=240)
    biggest_hit_src: str | None = None
    in_product_id: int = Field(gt=0)
    price: Decimal = Field(ge=0)
    total: Decimal
    total_boosters: int
    items: list[RecordItemResponse]
