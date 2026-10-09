from fastapi import APIRouter, status

from app.deps import DB, CurrentUser
from app.schemas.booking import BookingCreate, BookingOut
from app.services import booking_service

router = APIRouter(prefix="/bookings", tags=["bookings"])


@router.post("", response_model=BookingOut, status_code=status.HTTP_201_CREATED)
def create(db: DB, user: CurrentUser, data: BookingCreate):
    booking = booking_service.create_booking(db, user, data)
    return booking_service.to_booking_out(db, [booking])[0]


@router.get("/me", response_model=list[BookingOut])
def my_trips(db: DB, user: CurrentUser):
    return booking_service.guest_bookings(db, user)


@router.get("/{booking_id}", response_model=BookingOut)
def get_one(db: DB, user: CurrentUser, booking_id: int):
    return booking_service.get_booking(db, user, booking_id)


@router.patch("/{booking_id}/cancel", response_model=BookingOut)
def cancel(db: DB, user: CurrentUser, booking_id: int):
    return booking_service.cancel_booking(db, user, booking_id)
