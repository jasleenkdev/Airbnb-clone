from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Integer, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

RATING_FIELDS = ("rating", "cleanliness", "accuracy", "communication", "location", "check_in_rating", "value")


class Review(Base):
    __tablename__ = "reviews"
    __table_args__ = tuple(
        CheckConstraint(f"{f} BETWEEN 1 AND 5", name=f"ck_review_{f}") for f in RATING_FIELDS
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    listing_id: Mapped[int] = mapped_column(ForeignKey("listings.id", ondelete="CASCADE"), index=True)
    booking_id: Mapped[int | None] = mapped_column(
        ForeignKey("bookings.id", ondelete="SET NULL"), unique=True, nullable=True
    )
    author_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    rating: Mapped[int] = mapped_column(Integer)
    cleanliness: Mapped[int] = mapped_column(Integer)
    accuracy: Mapped[int] = mapped_column(Integer)
    communication: Mapped[int] = mapped_column(Integer)
    location: Mapped[int] = mapped_column(Integer)
    check_in_rating: Mapped[int] = mapped_column(Integer)
    value: Mapped[int] = mapped_column(Integer)
    comment: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    author: Mapped["User"] = relationship()  # noqa: F821
    listing: Mapped["Listing"] = relationship()  # noqa: F821
    booking: Mapped["Booking | None"] = relationship()  # noqa: F821
