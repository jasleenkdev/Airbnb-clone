from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.models.booking import BookingStatus
from app.schemas.user import UserBrief


class BookingCreate(BaseModel):
    listing_id: int
    check_in: date
    check_out: date
    guests: int = Field(ge=1, le=50)

    @model_validator(mode="after")
    def dates_ordered(self) -> "BookingCreate":
        if self.check_out <= self.check_in:
            raise ValueError("check_out must be after check_in")
        return self


class BookingListing(BaseModel):
    id: int
    title: str
    city: str
    country: str
    image: str | None
    host_name: str


class BookingOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    listing_id: int
    guest_id: int
    check_in: date
    check_out: date
    nights: int
    guests: int
    nightly_price: int
    cleaning_fee: int
    service_fee: int
    total_price: int
    status: BookingStatus
    created_at: datetime
    listing: BookingListing
    guest: UserBrief
    has_review: bool = False
    can_review: bool = False
    can_cancel: bool = False
