from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from modules.products.models import Product


def list_active_products(db: Session) -> list[Product]:
    stmt = (
        select(Product)
        .where(Product.is_active.is_(True))
        .order_by(Product.created_at.desc())
    )
    return list(db.scalars(stmt).all())


def get_active_product(db: Session, product_id: UUID) -> Product | None:
    stmt = select(Product).where(Product.id == product_id, Product.is_active.is_(True))
    return db.scalars(stmt).first()


def list_all_products(db: Session) -> list[Product]:
    stmt = select(Product).order_by(Product.created_at.desc())
    return list(db.scalars(stmt).all())


def increment_sold_count(db: Session, product_id: UUID, quantity: int = 1) -> None:
    product = db.get(Product, product_id)
    if product:
        product.sold_count += quantity
