from typing import Annotated

from fastapi import Depends, Header
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.services.errors import Unauthorized

DB = Annotated[Session, Depends(get_db)]


def get_optional_user(db: DB, x_user_id: Annotated[int | None, Header()] = None) -> User | None:
    """Mock auth: the client identifies itself with an `X-User-Id` header."""
    if x_user_id is None:
        return None
    return db.get(User, x_user_id)


def get_current_user(user: Annotated[User | None, Depends(get_optional_user)]) -> User:
    if user is None:
        raise Unauthorized("Sign in required: send a valid X-User-Id header.")
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]
