from datetime import datetime

from pydantic import BaseModel, ConfigDict


class UserBrief(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    avatar_url: str | None = None


class UserOut(UserBrief):
    email: str
    is_host: bool
    is_superhost: bool
    bio: str | None = None
    created_at: datetime


class HostOut(UserOut):
    listing_count: int = 0
    review_count: int = 0
    avg_rating: float | None = None
