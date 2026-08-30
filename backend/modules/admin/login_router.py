from fastapi import APIRouter, Body, Depends, HTTPException, Response
from sqlalchemy.orm import Session

from app.config import settings
from database.connection import get_db
from database.serializers import user_public
from modules.auth.dependencies import require_admin
from modules.auth.service import create_session_token, verify_password
from modules.users import service as user_service
from modules.users.models import User

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.post("/login")
def admin_login(
    response: Response,
    email: str = Body(...),
    password: str = Body(...),
    db: Session = Depends(get_db),
):
    user = user_service.get_by_email(db, email)
    if not user or not user.is_admin or not verify_password(password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_session_token(str(user.id), settings.admin_cookie_secret)
    response.set_cookie(
        key="session",
        value=token,
        httponly=True,
        secure=False,
        samesite="lax",
        path="/",
        max_age=60 * 60 * 8,
    )
    return {"ok": True, "user": user_public(user)}


@router.post("/logout")
def admin_logout(response: Response):
    response.delete_cookie(key="session", path="/")
    return {"ok": True}


@router.get("/me")
def admin_me(user: User = Depends(require_admin)):
    return user_public(user)
