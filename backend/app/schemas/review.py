from datetime import datetime
from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.user import UserBrief

Score = Annotated[int, Field(ge=1, le=5)]


class ReviewCreate(BaseModel):
    booking_id: int
    rating: Score
    cleanliness: Score
    accuracy: Score
    communication: Score
    location: Score
    check_in_rating: Score
    value: Score
    comment: str = Field(min_length=10, max_length=2000)


class ReviewOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    listing_id: int
    booking_id: int | None
    rating: int
    cleanliness: int
    accuracy: int
    communication: int
    location: int
    check_in_rating: int
    value: int
    comment: str
    created_at: datetime
    author: UserBrief
