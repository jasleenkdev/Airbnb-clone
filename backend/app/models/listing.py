import enum
from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, Enum, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.amenity import Amenity, listing_amenities


class PropertyType(str, enum.Enum):
    house = "house"
    apartment = "apartment"
    cabin = "cabin"
    villa = "villa"
    cottage = "cottage"
    tiny_home = "tiny_home"
    treehouse = "treehouse"
    beachfront = "beachfront"


class Listing(Base):
    __tablename__ = "listings"
    __table_args__ = (
        CheckConstraint("price_per_night > 0", name="ck_listing_price_positive"),
        CheckConstraint("cleaning_fee >= 0", name="ck_listing_cleaning_fee_nonneg"),
        CheckConstraint("service_fee_pct >= 0 AND service_fee_pct <= 30", name="ck_listing_service_pct"),
        CheckConstraint("max_guests >= 1", name="ck_listing_max_guests"),
        CheckConstraint("bedrooms >= 0 AND beds >= 1 AND bathrooms >= 0", name="ck_listing_rooms"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    host_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(200))
    description: Mapped[str] = mapped_column(Text)
    property_type: Mapped[PropertyType] = mapped_column(
        Enum(PropertyType, name="property_type", native_enum=False, validate_strings=True), index=True
    )
    category: Mapped[str] = mapped_column(String(50), index=True)
    city: Mapped[str] = mapped_column(String(100), index=True)
    state: Mapped[str | None] = mapped_column(String(100))
    country: Mapped[str] = mapped_column(String(100), index=True)
    address: Mapped[str] = mapped_column(String(255))
    latitude: Mapped[float] = mapped_column(Float)
    longitude: Mapped[float] = mapped_column(Float)
    # Money is stored as whole currency units (USD) to avoid float rounding.
    price_per_night: Mapped[int] = mapped_column(Integer, index=True)
    cleaning_fee: Mapped[int] = mapped_column(Integer, default=0)
    service_fee_pct: Mapped[int] = mapped_column(Integer, default=14)
    max_guests: Mapped[int] = mapped_column(Integer)
    bedrooms: Mapped[int] = mapped_column(Integer)
    beds: Mapped[int] = mapped_column(Integer)
    bathrooms: Mapped[float] = mapped_column(Float)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    host: Mapped["User"] = relationship(back_populates="listings")  # noqa: F821
    images: Mapped[list["ListingImage"]] = relationship(
        back_populates="listing", cascade="all, delete-orphan", order_by="ListingImage.position"
    )
    amenities: Mapped[list[Amenity]] = relationship(secondary=listing_amenities, order_by=Amenity.id)


class ListingImage(Base):
    __tablename__ = "listing_images"

    id: Mapped[int] = mapped_column(primary_key=True)
    listing_id: Mapped[int] = mapped_column(ForeignKey("listings.id", ondelete="CASCADE"), index=True)
    url: Mapped[str] = mapped_column(String(1000))
    position: Mapped[int] = mapped_column(Integer, default=0)

    listing: Mapped[Listing] = relationship(back_populates="images")
