from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.models import Booking, BookingStatus, Review, User
from app.schemas.review import ReviewCreate
from app.services.booking_service import complete_past_bookings
from app.services.errors import BadRequest, Conflict, Forbidden, NotFound


def list_reviews(db: Session, listing_id: int) -> list[Review]:
    return list(
        db.scalars(
            select(Review)
            .where(Review.listing_id == listing_id)
            .options(joinedload(Review.author))
            .order_by(Review.created_at.desc(), Review.id.desc())
        )
    )


def create_review(db: Session, author: User, data: ReviewCreate) -> Review:
    complete_past_bookings(db)
    booking = db.get(Booking, data.booking_id)
    if not booking:
        raise NotFound("Booking not found.")
    if booking.guest_id != author.id:
        raise Forbidden("You can only review your own stays.")
    if booking.status != BookingStatus.completed:
        raise BadRequest("You can leave a review once your stay is completed.")
    if db.scalar(select(Review.id).where(Review.booking_id == booking.id)):
        raise Conflict("You've already reviewed this stay.")

    review = Review(listing_id=booking.listing_id, author_id=author.id, **data.model_dump())
    db.add(review)
    db.commit()
    db.refresh(review)
    _ = review.author  # load for the response
    return review
