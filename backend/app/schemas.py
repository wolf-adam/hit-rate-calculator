from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class SetResponse(BaseModel):
    id: int
    short_name: str
    long_name: str
   
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
    special: int
    biggest_hit_link: str = Field(min_length=1, max_length=240)
    price: Decimal = Field(ge=0)


class RecordResponse(BaseModel):
    id: int
    name: str = Field(min_length=1, max_length=160)
    ex: int
    ir: int
    sir: int
    special: int
    biggest_hit_link: str = Field(min_length=1, max_length=240)
    in_product_id: int = Field(gt=0)
    price: Decimal = Field(ge=0)
    total: Decimal
    total_boosters: int
