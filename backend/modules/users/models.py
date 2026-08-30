from typing import TYPE_CHECKING

from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database.connection import Base
from database.models import TimestampUpdatedModel, UUIDModel

if TYPE_CHECKING:
    from modules.carts.models import Cart
    from modules.orders.models import Order

ROLE_ADMIN = "admin"
ROLE_CUSTOMER = "customer"
VALID_ROLES = {ROLE_ADMIN, ROLE_CUSTOMER}


class User(Base, UUIDModel, TimestampUpdatedModel):
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(Text, nullable=False, unique=True)
    first_name: Mapped[str | None] = mapped_column(Text, nullable=True)
    last_name: Mapped[str | None] = mapped_column(Text, nullable=True)
    role: Mapped[str] = mapped_column(String(32), nullable=False, default=ROLE_CUSTOMER)
    password_hash: Mapped[str | None] = mapped_column(Text, nullable=True)

    carts: Mapped[list["Cart"]] = relationship(back_populates="user")
    orders: Mapped[list["Order"]] = relationship(back_populates="user")

    @property
    def is_admin(self) -> bool:
        return self.role == ROLE_ADMIN

    @property
    def full_name(self) -> str | None:
        parts = [p for p in [self.first_name, self.last_name] if p]
        return " ".join(parts) if parts else None
