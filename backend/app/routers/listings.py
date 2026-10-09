from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, Query, Response, status

from app.deps import DB, CurrentUser
from app.models import PropertyType
from app.schemas.common import Page, PriceHistogram
from app.schemas.listing import BookedRange, ListingCard, ListingCreate, ListingDetail, ListingUpdate, PriceQuote
from app.schemas.review import ReviewOut
from app.services import listing_service, review_service
from app.services.availability import booked_ranges
from app.services.errors import BadRequest
from app.services.listing_service import ListingFilters

router = APIRouter(prefix="/listings", tags=["listings"])


def _int_list(raw: str | None) -> list[int]:
    if not raw:
        return []
    try:
        return [int(x) for x in raw.split(",") if x.strip()]
    except ValueError as exc:
        raise BadRequest("amenities must be a comma-separated list of ids") from exc


def _filters(
    location: str | None = None,
    check_in: date | None = None,
    check_out: date | None = None,
    guests: Annotated[int | None, Query(ge=1)] = None,
    min_price: Annotated[int | None, Query(ge=0)] = None,
    max_price: Annotated[int | None, Query(ge=0)] = None,
    property_type: Annotated[str | None, Query(description="Comma-separated property types")] = None,
    category: str | None = None,
    amenities: Annotated[str | None, Query(description="Comma-separated amenity ids, e.g. 1,2")] = None,
    min_bedrooms: Annotated[int | None, Query(ge=0)] = None,
    min_beds: Annotated[int | None, Query(ge=0)] = None,
    min_bathrooms: Annotated[float | None, Query(ge=0)] = None,
) -> ListingFilters:
    types: list[PropertyType] = []
    for raw in (property_type or "").split(","):
        if raw.strip():
            try:
                types.append(PropertyType(raw.strip()))
            except ValueError as exc:
                raise BadRequest(f"Unknown property_type '{raw}'") from exc
    return ListingFilters(
        location=location or None,
        check_in=check_in,
        check_out=check_out,
        guests=guests,
        min_price=min_price,
        max_price=max_price,
        property_types=types,
        category=category or None,
        amenity_ids=_int_list(amenities),
        min_bedrooms=min_bedrooms,
        min_beds=min_beds,
        min_bathrooms=min_bathrooms,
    )


Filters = Annotated[ListingFilters, Depends(_filters)]


@router.get("", response_model=Page[ListingCard])
def search(
    db: DB,
    filters: Filters,
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=48)] = 20,
):
    return listing_service.search_listings(db, filters, page, page_size)


@router.get("/price-histogram", response_model=PriceHistogram)
def histogram(db: DB, filters: Filters):
    return listing_service.price_histogram(db, filters)


@router.get("/{listing_id}", response_model=ListingDetail)
def detail(db: DB, listing_id: int):
    return listing_service.get_listing_detail(db, listing_id)


@router.get("/{listing_id}/availability", response_model=list[BookedRange])
def availability(db: DB, listing_id: int):
    """Booked [check_in, check_out) ranges from today on. check_out day itself is bookable."""
    listing_service.get_listing_or_404(db, listing_id)
    return [BookedRange(check_in=a, check_out=b) for a, b in booked_ranges(db, listing_id)]


@router.get("/{listing_id}/quote", response_model=PriceQuote)
def price_quote(db: DB, listing_id: int, check_in: date, check_out: date):
    return listing_service.quote(db, listing_id, check_in, check_out)


@router.get("/{listing_id}/reviews", response_model=list[ReviewOut])
def reviews(db: DB, listing_id: int):
    listing_service.get_listing_or_404(db, listing_id)
    return review_service.list_reviews(db, listing_id)


@router.post("", response_model=ListingDetail, status_code=status.HTTP_201_CREATED)
def create(db: DB, user: CurrentUser, data: ListingCreate):
    return listing_service.create_listing(db, user, data)


@router.put("/{listing_id}", response_model=ListingDetail)
def update(db: DB, user: CurrentUser, listing_id: int, data: ListingUpdate):
    return listing_service.update_listing(db, user, listing_id, data)


@router.delete("/{listing_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove(db: DB, user: CurrentUser, listing_id: int):
    listing_service.delete_listing(db, user, listing_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
