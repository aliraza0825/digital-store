from uuid import UUID

from fastapi import Cookie, Depends, HTTPException
from sqlalchemy.orm import Session

from app.config import settings
from database.connection import get_db
from modules.auth.service import parse_session_token
from modules.users.models import ROLE_ADMIN, User


def get_current_user(
    session: str | None = Cookie(default=None, alias="session"),
    db: Session = Depends(get_db),
) -> User | None:
    user_id = parse_session_token(session, settings.admin_cookie_secret)
    if not user_id:
        return None
    try:
        return db.get(User, UUID(user_id))
    except ValueError:
        return None


def require_user(user: User | None = Depends(get_current_user)) -> User:
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user


def require_admin(user: User = Depends(require_user)) -> User:
    if user.role != ROLE_ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")
    return user
