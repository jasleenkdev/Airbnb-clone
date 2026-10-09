from fastapi import APIRouter, status

from app.deps import DB, CurrentUser
from app.schemas.review import ReviewCreate, ReviewOut
from app.services import review_service

router = APIRouter(prefix="/reviews", tags=["reviews"])


@router.post("", response_model=ReviewOut, status_code=status.HTTP_201_CREATED)
def create(db: DB, user: CurrentUser, data: ReviewCreate):
    return review_service.create_review(db, user, data)
