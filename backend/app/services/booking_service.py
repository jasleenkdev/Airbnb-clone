import threading
from datetime import date

from sqlalchemy import select, update
from sqlalchemy.orm import Session, joinedload, selectinload

from app.models import Booking, BookingStatus, Listing, Review, User
from app.schemas.booking import BookingCreate, BookingListing, BookingOut
from app.schemas.user import UserBrief
from app.services.availability import has_conflict, validate_stay_dates
from app.services.errors import BadRequest, Conflict, Forbidden, NotFound
from app.services.pricing import calculate_price

# SQLite allows a single writer, but the overlap check (read) and insert (write) are two
# statements. Serialize them inside this process so two requests can't both pass the check.
# With Postgres this would be an exclusion constraint on (listing_id, daterange) instead.
_booking_lock = threading.Lock()


def complete_past_bookings(db: Session, today: date | None = None) -> None:
    """Lazily flip confirmed stays whose check-out has passed to `completed`."""
    today = today or date.today()
    db.execute(
        update(Booking)
        .where(Booking.status == BookingStatus.confirmed, Booking.check_out <= today)
        .values(status=BookingStatus.completed)
    )
    db.commit()


def create_booking(db: Session, guest: User, data: BookingCreate) -> Booking:
    listing = db.get(Listing, data.listing_id)
    if not listing:
        raise NotFound("Listing not found.")
    if listing.host_id == guest.id:
        raise Forbidden("You can't book your own listing.")
    if data.guests > listing.max_guests:
        raise BadRequest(f"This place allows a maximum of {listing.max_guests} guests.")
    nights = validate_stay_dates(data.check_in, data.check_out)

    with _booking_lock:
        if has_conflict(db, listing.id, data.check_in, data.check_out):
            raise Conflict("Those dates are no longer available. Please choose different dates.")
        price = calculate_price(listing.price_per_night, listing.cleaning_fee, listing.service_fee_pct, nights)
        booking = Booking(
            listing_id=listing.id,
            guest_id=guest.id,
            check_in=data.check_in,
            check_out=data.check_out,
            guests=data.guests,
            nightly_price=price.nightly_price,
            cleaning_fee=price.cleaning_fee,
            service_fee=price.service_fee,
            total_price=price.total_price,
            status=BookingStatus.confirmed,
        )
        db.add(booking)
        db.commit()
    return _load(db, booking.id)


def _load(db: Session, booking_id: int) -> Booking:
    booking = db.scalar(
        select(Booking)
        .where(Booking.id == booking_id)
        .options(
            joinedload(Booking.listing).selectinload(Listing.images),
            joinedload(Booking.listing).joinedload(Listing.host),
            joinedload(Booking.guest),
        )
    )
    if not booking:
        raise NotFound("Booking not found.")
    return booking


def get_booking(db: Session, user: User, booking_id: int) -> BookingOut:
    booking = _load(db, booking_id)
    if user.id not in (booking.guest_id, booking.listing.host_id):
        raise Forbidden("You don't have access to this booking.")
    return to_booking_out(db, [booking])[0]


def cancel_booking(db: Session, user: User, booking_id: int) -> BookingOut:
    booking = _load(db, booking_id)
    if user.id not in (booking.guest_id, booking.listing.host_id):
        raise Forbidden("You can only cancel your own bookings.")
    if booking.status != BookingStatus.confirmed:
        raise BadRequest(f"This booking is already {booking.status.value}.")
    if booking.check_in <= date.today():
        raise BadRequest("Stays that have already started can't be cancelled.")
    booking.status = BookingStatus.cancelled
    db.commit()
    return to_booking_out(db, [booking])[0]


def to_booking_out(db: Session, bookings: list[Booking], today: date | None = None) -> list[BookingOut]:
    today = today or date.today()
    ids = [b.id for b in bookings]
    reviewed = set(db.scalars(select(Review.booking_id).where(Review.booking_id.in_(ids)))) if ids else set()
    out = []
    for b in bookings:
        has_review = b.id in reviewed
        out.append(
            BookingOut(
                id=b.id,
                listing_id=b.listing_id,
                guest_id=b.guest_id,
                check_in=b.check_in,
                check_out=b.check_out,
                nights=b.nights,
                guests=b.guests,
                nightly_price=b.nightly_price,
                cleaning_fee=b.cleaning_fee,
                service_fee=b.service_fee,
                total_price=b.total_price,
                status=b.status,
                created_at=b.created_at,
                listing=BookingListing(
                    id=b.listing.id,
                    title=b.listing.title,
                    city=b.listing.city,
                    country=b.listing.country,
                    image=b.listing.images[0].url if b.listing.images else None,
                    host_name=b.listing.host.name,
                ),
                guest=UserBrief.model_validate(b.guest),
                has_review=has_review,
                can_review=b.status == BookingStatus.completed and not has_review,
                can_cancel=b.status == BookingStatus.confirmed and b.check_in > today,
            )
        )
    return out


def _bookings_query():
    return select(Booking).options(
        joinedload(Booking.listing).selectinload(Listing.images),
        joinedload(Booking.listing).joinedload(Listing.host),
        joinedload(Booking.guest),
    )


def guest_bookings(db: Session, user: User) -> list[BookingOut]:
    complete_past_bookings(db)
    rows = db.scalars(_bookings_query().where(Booking.guest_id == user.id).order_by(Booking.check_in.desc()))
    return to_booking_out(db, list(rows.unique()))


def host_bookings(db: Session, user: User) -> list[BookingOut]:
    if not user.is_host:
        raise Forbidden("Only hosts have incoming reservations.")
    complete_past_bookings(db)
    rows = db.scalars(
        _bookings_query().join(Listing, Listing.id == Booking.listing_id).where(Listing.host_id == user.id).order_by(Booking.check_in.desc())
    )
    return to_booking_out(db, list(rows.unique()))
