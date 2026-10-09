from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field, HttpUrl, field_validator

from app.models.listing import PropertyType
from app.schemas.common import AmenityOut
from app.schemas.user import HostOut


class ImageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    url: str
    position: int


class RatingSummary(BaseModel):
    avg_rating: float | None = None
    review_count: int = 0
    cleanliness: float | None = None
    accuracy: float | None = None
    communication: float | None = None
    location: float | None = None
    check_in: float | None = None
    value: float | None = None
    distribution: dict[int, int] = Field(default_factory=dict)


class ListingCard(BaseModel):
    id: int
    title: str
    property_type: PropertyType
    category: str
    city: str
    state: str | None
    country: str
    latitude: float
    longitude: float
    price_per_night: int
    max_guests: int
    bedrooms: int
    beds: int
    bathrooms: float
    images: list[str]
    avg_rating: float | None = None
    review_count: int = 0
    host_name: str
    host_is_superhost: bool


class ListingDetail(BaseModel):
    id: int
    host_id: int
    title: str
    description: str
    property_type: PropertyType
    category: str
    city: str
    state: str | None
    country: str
    address: str
    latitude: float
    longitude: float
    price_per_night: int
    cleaning_fee: int
    service_fee_pct: int
    max_guests: int
    bedrooms: int
    beds: int
    bathrooms: float
    created_at: datetime
    updated_at: datetime
    images: list[ImageOut]
    amenities: list[AmenityOut]
    host: HostOut
    rating: RatingSummary


class ListingBase(BaseModel):
    title: str = Field(min_length=5, max_length=200)
    description: str = Field(min_length=20, max_length=5000)
    property_type: PropertyType
    category: str = Field(min_length=2, max_length=50)
    city: str = Field(min_length=1, max_length=100)
    state: str | None = Field(default=None, max_length=100)
    country: str = Field(min_length=2, max_length=100)
    address: str = Field(min_length=3, max_length=255)
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    price_per_night: int = Field(gt=0, le=100_000)
    cleaning_fee: int = Field(default=0, ge=0, le=10_000)
    service_fee_pct: int = Field(default=14, ge=0, le=30)
    max_guests: int = Field(ge=1, le=50)
    bedrooms: int = Field(ge=0, le=50)
    beds: int = Field(ge=1, le=100)
    bathrooms: float = Field(ge=0, le=50)
    amenity_ids: list[int] = Field(default_factory=list)
    image_urls: list[HttpUrl] = Field(min_length=1, max_length=20)

    @field_validator("bathrooms")
    @classmethod
    def half_steps(cls, v: float) -> float:
        if (v * 2) != int(v * 2):
            raise ValueError("bathrooms must be a multiple of 0.5")
        return v


class ListingCreate(ListingBase):
    pass


class ListingUpdate(ListingBase):
    """Full replacement (PUT) of the editable listing fields."""


class BookedRange(BaseModel):
    check_in: date
    check_out: date


class PriceQuote(BaseModel):
    nights: int
    nightly_price: int
    subtotal: int
    cleaning_fee: int
    service_fee: int
    total_price: int
