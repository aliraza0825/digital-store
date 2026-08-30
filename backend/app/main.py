from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
import database.registry  # noqa: F401 — register all SQLAlchemy models
from database.connection import SessionLocal
from modules.admin.login_router import router as admin_login_router
from modules.admin.router import router as admin_router
from modules.carts.router import router as cart_router
from modules.checkout.router import router as checkout_router
from modules.download.router import router as download_router
from modules.orders.router import router as order_status_router
from modules.media.router import router as media_router
from modules.products.router import router as products_router
from modules.storage.service import ensure_storage_dirs
from modules.users import service as user_service
from modules.users.router import router as users_router
from modules.webhooks.router import router as webhooks_router


def seed_admin() -> None:
    if not settings.admin_email or not settings.admin_password:
        return
    db = SessionLocal()
    try:
        user_service.ensure_admin_user(
            db, email=settings.admin_email, password=settings.admin_password
        )
    finally:
        db.close()


def create_app() -> FastAPI:
    ensure_storage_dirs()

    app = FastAPI(title="Digital Store API", version="1.0.0")

    origins = [origin.strip() for origin in settings.cors_origins.split(",") if origin.strip()]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(products_router)
    app.include_router(media_router)
    app.include_router(cart_router)
    app.include_router(checkout_router)
    app.include_router(order_status_router)
    app.include_router(users_router)
    app.include_router(download_router)
    app.include_router(webhooks_router)
    app.include_router(admin_login_router)
    app.include_router(admin_router)

    @app.on_event("startup")
    def on_startup():
        seed_admin()

    @app.get("/health")
    def health():
        return {"status": "ok"}

    return app


app = create_app()
