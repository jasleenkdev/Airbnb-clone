from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.models import Listing, User, Wishlist
from app.schemas.listing import ListingCard
from app.services.errors import NotFound
from app.services.listing_service import cards_for_ids


def wishlist_cards(db: Session, user: User) -> list[ListingCard]:
    ids = list(
        db.scalars(
            select(Wishlist.listing_id).where(Wishlist.user_id == user.id).order_by(Wishlist.created_at.desc())
        )
    )
    return cards_for_ids(db, ids)


def add(db: Session, user: User, listing_id: int) -> None:
    if not db.get(Listing, listing_id):
        raise NotFound("Listing not found.")
    if not db.get(Wishlist, (user.id, listing_id)):
        db.add(Wishlist(user_id=user.id, listing_id=listing_id))
        db.commit()


def remove(db: Session, user: User, listing_id: int) -> None:
    db.execute(delete(Wishlist).where(Wishlist.user_id == user.id, Wishlist.listing_id == listing_id))
    db.commit()
