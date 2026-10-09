import math
from dataclasses import dataclass, field
from datetime import date

from sqlalchemy import Select, delete, func, or_, select
from sqlalchemy.orm import Session, joinedload, selectinload

from app.models import Amenity, Booking, BookingStatus, Listing, ListingImage, PropertyType, Review, User, listing_amenities
from app.schemas.common import Page, PriceHistogram
from app.schemas.listing import ListingBase, ListingCard, ListingDetail, PriceQuote, RatingSummary
from app.schemas.user import HostOut
from app.services.availability import overlap_clause, validate_stay_dates
from app.services.catalog import CATEGORY_SLUGS
from app.services.errors import BadRequest, Conflict, Forbidden, NotFound
from app.services.pricing import calculate_price

MAX_PAGE_SIZE = 48


@dataclass
class ListingFilters:
    location: str | None = None
    check_in: date | None = None
    check_out: date | None = None
    guests: int | None = None
    min_price: int | None = None
    max_price: int | None = None
    property_types: list[PropertyType] = field(default_factory=list)
    category: str | None = None
    amenity_ids: list[int] = field(default_factory=list)
    min_bedrooms: int | None = None
    min_beds: int | None = None
    min_bathrooms: float | None = None
    host_id: int | None = None


def _rating_subquery():
    """Per-listing average rating and review count, computed on the fly (never stored)."""
    return (
        select(
            Review.listing_id.label("listing_id"),
            func.avg(Review.rating).label("avg_rating"),
            func.count(Review.id).label("review_count"),
        )
        .group_by(Review.listing_id)
        .subquery()
    )


def _apply_filters(stmt: Select, f: ListingFilters, *, include_price: bool = True) -> Select:
    if f.location:
        term = f"%{f.location.strip()}%"
        stmt = stmt.where(
            or_(
                Listing.city.ilike(term),
                Listing.state.ilike(term),
                Listing.country.ilike(term),
                Listing.title.ilike(term),
            )
        )
    if f.check_in and f.check_out:
        if f.check_out <= f.check_in:
            raise BadRequest("check_out must be after check_in")
        # Exclude listings that have any blocking booking overlapping [check_in, check_out).
        busy = select(Booking.listing_id).where(overlap_clause(f.check_in, f.check_out))
        stmt = stmt.where(Listing.id.not_in(busy))
    if f.guests:
        stmt = stmt.where(Listing.max_guests >= f.guests)
    if include_price and f.min_price is not None:
        stmt = stmt.where(Listing.price_per_night >= f.min_price)
    if include_price and f.max_price is not None:
        stmt = stmt.where(Listing.price_per_night <= f.max_price)
    if f.property_types:
        stmt = stmt.where(Listing.property_type.in_(f.property_types))
    if f.category:
        stmt = stmt.where(Listing.category == f.category)
    if f.min_bedrooms:
        stmt = stmt.where(Listing.bedrooms >= f.min_bedrooms)
    if f.min_beds:
        stmt = stmt.where(Listing.beds >= f.min_beds)
    if f.min_bathrooms:
        stmt = stmt.where(Listing.bathrooms >= f.min_bathrooms)
    if f.host_id:
        stmt = stmt.where(Listing.host_id == f.host_id)
    if f.amenity_ids:
        # Listing must have ALL requested amenities.
        ids = list(set(f.amenity_ids))
        has_all = (
            select(listing_amenities.c.listing_id)
            .where(listing_amenities.c.amenity_id.in_(ids))
            .group_by(listing_amenities.c.listing_id)
            .having(func.count(listing_amenities.c.amenity_id) == len(ids))
        )
        stmt = stmt.where(Listing.id.in_(has_all))
    return stmt


def to_card(listing: Listing, avg_rating: float | None, review_count: int | None) -> ListingCard:
    return ListingCard(
        id=listing.id,
        title=listing.title,
        property_type=listing.property_type,
        category=listing.category,
        city=listing.city,
        state=listing.state,
        country=listing.country,
        latitude=listing.latitude,
        longitude=listing.longitude,
        price_per_night=listing.price_per_night,
        max_guests=listing.max_guests,
        bedrooms=listing.bedrooms,
        beds=listing.beds,
        bathrooms=listing.bathrooms,
        images=[img.url for img in listing.images],
        avg_rating=round(float(avg_rating), 2) if avg_rating is not None else None,
        review_count=review_count or 0,
        host_name=listing.host.name,
        host_is_superhost=listing.host.is_superhost,
    )


def _cards_query(listing_filter) -> Select:
    ratings = _rating_subquery()
    return (
        select(Listing, ratings.c.avg_rating, ratings.c.review_count)
        .outerjoin(ratings, ratings.c.listing_id == Listing.id)
        .options(selectinload(Listing.images), joinedload(Listing.host))
        .where(listing_filter)
    )


def search_listings(db: Session, f: ListingFilters, page: int = 1, page_size: int = 20) -> Page[ListingCard]:
    page = max(page, 1)
    page_size = min(max(page_size, 1), MAX_PAGE_SIZE)
    ids_stmt = _apply_filters(select(Listing.id), f)
    total = db.scalar(select(func.count()).select_from(ids_stmt.subquery())) or 0

    rows = db.execute(
        _cards_query(Listing.id.in_(ids_stmt)).order_by(Listing.id).offset((page - 1) * page_size).limit(page_size)
    ).all()
    return Page[ListingCard](
        items=[to_card(lst, avg, cnt) for lst, avg, cnt in rows],
        total=total,
        page=page,
        page_size=page_size,
        pages=math.ceil(total / page_size) if total else 0,
    )


def cards_for_ids(db: Session, ids: list[int]) -> list[ListingCard]:
    if not ids:
        return []
    rows = db.execute(_cards_query(Listing.id.in_(ids))).all()
    by_id = {lst.id: to_card(lst, avg, cnt) for lst, avg, cnt in rows}
    return [by_id[i] for i in ids if i in by_id]


def price_histogram(db: Session, f: ListingFilters, bucket_count: int = 30) -> PriceHistogram:
    """Histogram of nightly prices for the filters modal (price filter itself ignored)."""
    prices = list(db.scalars(_apply_filters(select(Listing.price_per_night), f, include_price=False)))
    if not prices:
        return PriceHistogram(min_price=0, max_price=0, buckets=[0] * bucket_count, bucket_size=1)
    lo, hi = min(prices), max(prices)
    size = max(1, math.ceil((hi - lo + 1) / bucket_count))
    buckets = [0] * bucket_count
    for p in prices:
        buckets[min((p - lo) // size, bucket_count - 1)] += 1
    return PriceHistogram(min_price=lo, max_price=hi, buckets=buckets, bucket_size=size)


def rating_summary(db: Session, listing_id: int) -> RatingSummary:
    row = db.execute(
        select(
            func.avg(Review.rating),
            func.count(Review.id),
            func.avg(Review.cleanliness),
            func.avg(Review.accuracy),
            func.avg(Review.communication),
            func.avg(Review.location),
            func.avg(Review.check_in_rating),
            func.avg(Review.value),
        ).where(Review.listing_id == listing_id)
    ).one()
    dist_rows = db.execute(
        select(Review.rating, func.count()).where(Review.listing_id == listing_id).group_by(Review.rating)
    ).all()

    def r(v):
        return round(float(v), 2) if v is not None else None

    return RatingSummary(
        avg_rating=r(row[0]),
        review_count=row[1] or 0,
        cleanliness=r(row[2]),
        accuracy=r(row[3]),
        communication=r(row[4]),
        location=r(row[5]),
        check_in=r(row[6]),
        value=r(row[7]),
        distribution={star: 0 for star in range(1, 6)} | {rating: count for rating, count in dist_rows},
    )


def host_profile(db: Session, host: User) -> HostOut:
    listing_count = db.scalar(select(func.count(Listing.id)).where(Listing.host_id == host.id)) or 0
    avg, count = db.execute(
        select(func.avg(Review.rating), func.count(Review.id))
        .join(Listing, Listing.id == Review.listing_id)
        .where(Listing.host_id == host.id)
    ).one()
    base = HostOut.model_validate(host)
    return base.model_copy(
        update={
            "listing_count": listing_count,
            "review_count": count or 0,
            "avg_rating": round(float(avg), 2) if avg is not None else None,
        }
    )


def get_listing_or_404(db: Session, listing_id: int) -> Listing:
    listing = db.get(
        Listing,
        listing_id,
        options=[selectinload(Listing.images), selectinload(Listing.amenities), joinedload(Listing.host)],
    )
    if not listing:
        raise NotFound("Listing not found.")
    return listing


def get_listing_detail(db: Session, listing_id: int) -> ListingDetail:
    listing = get_listing_or_404(db, listing_id)
    return ListingDetail.model_validate(
        {
            **{c.key: getattr(listing, c.key) for c in Listing.__table__.columns},
            "images": listing.images,
            "amenities": listing.amenities,
            "host": host_profile(db, listing.host),
            "rating": rating_summary(db, listing.id),
        }
    )


def quote(db: Session, listing_id: int, check_in: date, check_out: date) -> PriceQuote:
    listing = get_listing_or_404(db, listing_id)
    nights = validate_stay_dates(check_in, check_out)
    p = calculate_price(listing.price_per_night, listing.cleaning_fee, listing.service_fee_pct, nights)
    return PriceQuote(**p.__dict__)


# ---------- host CRUD ----------


def _require_host(user: User) -> None:
    if not user.is_host:
        raise Forbidden("Only hosts can manage listings. Switch to a host account.")


def _apply_payload(db: Session, listing: Listing, data: ListingBase) -> None:
    if data.category not in CATEGORY_SLUGS:
        raise BadRequest(f"Unknown category '{data.category}'.")
    fields = data.model_dump(exclude={"amenity_ids", "image_urls"})
    for key, value in fields.items():
        setattr(listing, key, value)

    amenity_ids = sorted(set(data.amenity_ids))
    amenities = list(db.scalars(select(Amenity).where(Amenity.id.in_(amenity_ids)))) if amenity_ids else []
    if len(amenities) != len(amenity_ids):
        raise BadRequest("One or more amenity ids are invalid.")
    listing.amenities = amenities
    listing.images = [ListingImage(url=str(url), position=i) for i, url in enumerate(data.image_urls)]


def create_listing(db: Session, user: User, data: ListingBase) -> ListingDetail:
    _require_host(user)
    listing = Listing(host_id=user.id)
    _apply_payload(db, listing, data)
    db.add(listing)
    db.commit()
    return get_listing_detail(db, listing.id)


def _owned_listing(db: Session, user: User, listing_id: int) -> Listing:
    _require_host(user)
    listing = get_listing_or_404(db, listing_id)
    if listing.host_id != user.id:
        raise Forbidden("You can only manage your own listings.")
    return listing


def update_listing(db: Session, user: User, listing_id: int, data: ListingBase) -> ListingDetail:
    listing = _owned_listing(db, user, listing_id)
    _apply_payload(db, listing, data)
    db.commit()
    return get_listing_detail(db, listing.id)


def delete_listing(db: Session, user: User, listing_id: int) -> None:
    listing = _owned_listing(db, user, listing_id)
    upcoming = db.scalar(
        select(func.count(Booking.id)).where(
            Booking.listing_id == listing.id,
            Booking.status == BookingStatus.confirmed,
            Booking.check_out > date.today(),
        )
    )
    if upcoming:
        raise Conflict(
            f"This listing has {upcoming} upcoming reservation(s). Cancel them before deleting the listing."
        )
    # Reviews/bookings/wishlists/images cascade at the DB level (ON DELETE CASCADE).
    db.execute(delete(Listing).where(Listing.id == listing.id))
    db.commit()


def host_listings(db: Session, user: User) -> list[ListingCard]:
    ids = list(db.scalars(select(Listing.id).where(Listing.host_id == user.id).order_by(Listing.created_at.desc(), Listing.id.desc())))
    return cards_for_ids(db, ids)
