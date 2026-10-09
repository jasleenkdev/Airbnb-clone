from fastapi import APIRouter
from sqlalchemy import select

from app.deps import DB, CurrentUser
from app.models import User
from app.schemas.user import UserOut

router = APIRouter(prefix="/users", tags=["users"])


@router.get("", response_model=list[UserOut])
def list_users(db: DB):
    """Seeded accounts the frontend can switch between (mock auth)."""
    return db.scalars(select(User).order_by(User.is_host.desc(), User.id))


@router.get("/me", response_model=UserOut)
def me(user: CurrentUser):
    return user
