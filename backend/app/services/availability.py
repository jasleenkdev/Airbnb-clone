from datetime import date

from sqlalchemy import ColumnElement, and_, exists, select
from sqlalchemy.orm import Session

from app.models import Booking, BookingStatus
from app.services.errors import BadRequest

# Statuses that occupy the calendar. Cancelled bookings free their dates.
BLOCKING_STATUSES = (BookingStatus.confirmed, BookingStatus.completed)
MAX_NIGHTS = 90


def ranges_overlap(a_start: date, a_end: date, b_start: date, b_end: date) -> bool:
    """Half-open intervals [start, end) overlap iff each starts before the other ends.

    Back-to-back stays (one checks out the day the next checks in) do NOT overlap.
    """
    return a_start < b_end and b_start < a_end


def overlap_clause(check_in: date, check_out: date) -> ColumnElement[bool]:
    """SQL version of `ranges_overlap` against blocking bookings."""
    return and_(
        Booking.status.in_(BLOCKING_STATUSES),
        Booking.check_in < check_out,
        Booking.check_out > check_in,
    )


def has_conflict(db: Session, listing_id: int, check_in: date, check_out: date) -> bool:
    stmt = select(exists().where(Booking.listing_id == listing_id, overlap_clause(check_in, check_out)))
    return bool(db.scalar(stmt))


def booked_ranges(db: Session, listing_id: int, from_date: date | None = None) -> list[tuple[date, date]]:
    from_date = from_date or date.today()
    rows = db.execute(
        select(Booking.check_in, Booking.check_out)
        .where(
            Booking.listing_id == listing_id,
            Booking.status.in_(BLOCKING_STATUSES),
            Booking.check_out > from_date,
        )
        .order_by(Booking.check_in)
    ).all()
    return [(r.check_in, r.check_out) for r in rows]


def validate_stay_dates(check_in: date, check_out: date, today: date | None = None) -> int:
    """Validate a requested stay and return the number of nights."""
    today = today or date.today()
    if check_out <= check_in:
        raise BadRequest("Check-out must be after check-in.")
    if check_in < today:
        raise BadRequest("Check-in date cannot be in the past.")
    nights = (check_out - check_in).days
    if nights > MAX_NIGHTS:
        raise BadRequest(f"Stays are limited to {MAX_NIGHTS} nights.")
    return nights
