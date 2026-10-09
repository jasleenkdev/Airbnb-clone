from typing import Generic, TypeVar

from pydantic import BaseModel, ConfigDict

T = TypeVar("T")


class Page(BaseModel, Generic[T]):
    items: list[T]
    total: int
    page: int
    page_size: int
    pages: int


class AmenityOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    icon: str


class CategoryOut(BaseModel):
    slug: str
    label: str
    icon: str


class PriceHistogram(BaseModel):
    min_price: int
    max_price: int
    buckets: list[int]
    bucket_size: int
