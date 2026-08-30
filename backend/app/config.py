import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv

_BACKEND_DIR = Path(__file__).resolve().parent.parent
load_dotenv(_BACKEND_DIR / ".env")


@dataclass(frozen=True)
class Settings:
    database_url: str
    site_url: str
    api_host: str
    api_port: int
    lemonsqueezy_api_key: str
    lemonsqueezy_store_id: str
    lemonsqueezy_webhook_secret: str
    admin_email: str
    admin_password: str
    admin_cookie_secret: str
    storage_dir: Path
    thumbnails_dir: Path
    product_files_dir: Path
    cors_origins: str


def _env(key: str, default: str = "") -> str:
    return os.getenv(key, default)


def _env_int(key: str, default: int) -> int:
    value = os.getenv(key)
    return int(value) if value else default


def load_settings() -> Settings:
    storage_dir = _BACKEND_DIR / "storage"
    return Settings(
        database_url=_env("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/digital_store"),
        site_url=_env("SITE_URL", "http://localhost:3000"),
        api_host=_env("API_HOST", "0.0.0.0"),
        api_port=_env_int("API_PORT", 8000),
        lemonsqueezy_api_key=_env("LEMONSQUEEZY_API_KEY"),
        lemonsqueezy_store_id=_env("LEMONSQUEEZY_STORE_ID"),
        lemonsqueezy_webhook_secret=_env("LEMONSQUEEZY_WEBHOOK_SECRET"),
        admin_email=_env("ADMIN_EMAIL", "admin@example.com"),
        admin_password=_env("ADMIN_PASSWORD", "changeme"),
        admin_cookie_secret=_env("ADMIN_COOKIE_SECRET", "changeme-use-a-long-random-string"),
        storage_dir=storage_dir,
        thumbnails_dir=storage_dir / "thumbnails",
        product_files_dir=storage_dir / "product-files",
        cors_origins=_env("CORS_ORIGINS", "http://localhost:3000"),
    )


settings = load_settings()
