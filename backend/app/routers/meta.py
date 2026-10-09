from fastapi import APIRouter
from sqlalchemy import select

from app.deps import DB
from app.models import Amenity
from app.schemas.common import AmenityOut, CategoryOut
from app.services.catalog import CATEGORIES

router = APIRouter(tags=["meta"])


@router.get("/amenities", response_model=list[AmenityOut])
def amenities(db: DB):
    return db.scalars(select(Amenity).order_by(Amenity.id))


@router.get("/categories", response_model=list[CategoryOut])
def categories():
    return CATEGORIES
