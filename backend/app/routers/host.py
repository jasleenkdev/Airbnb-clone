from fastapi import APIRouter

from app.deps import DB, CurrentUser
from app.schemas.booking import BookingOut
from app.schemas.listing import ListingCard
from app.services import booking_service, listing_service
from app.services.errors import Forbidden

router = APIRouter(prefix="/host", tags=["host"])


@router.get("/listings", response_model=list[ListingCard])
def my_listings(db: DB, user: CurrentUser):
    if not user.is_host:
        raise Forbidden("Only hosts have listings.")
    return listing_service.host_listings(db, user)


@router.get("/bookings", response_model=list[BookingOut])
def incoming_bookings(db: DB, user: CurrentUser):
    return booking_service.host_bookings(db, user)
