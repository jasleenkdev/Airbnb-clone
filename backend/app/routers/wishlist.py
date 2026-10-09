from fastapi import APIRouter, Response, status

from app.deps import DB, CurrentUser
from app.schemas.listing import ListingCard
from app.services import wishlist_service

router = APIRouter(prefix="/wishlist", tags=["wishlist"])


@router.get("", response_model=list[ListingCard])
def get_wishlist(db: DB, user: CurrentUser):
    return wishlist_service.wishlist_cards(db, user)


@router.post("/{listing_id}", status_code=status.HTTP_201_CREATED)
def add(db: DB, user: CurrentUser, listing_id: int):
    wishlist_service.add(db, user, listing_id)
    return {"listing_id": listing_id, "saved": True}


@router.delete("/{listing_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove(db: DB, user: CurrentUser, listing_id: int):
    wishlist_service.remove(db, user, listing_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
