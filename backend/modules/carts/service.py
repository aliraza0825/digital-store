from uuid import UUID

from sqlalchemy.orm import Session, selectinload

from modules.carts.models import Cart, CartItem
from modules.products.models import Product
from modules.products import service as product_service


def get_active_cart(db: Session, *, user_id: UUID | None = None, session_id: str | None = None) -> Cart | None:
    q = db.query(Cart).filter(Cart.status == "active")
    if user_id:
        q = q.filter(Cart.user_id == user_id)
    elif session_id:
        q = q.filter(Cart.session_id == session_id)
    else:
        return None
    return q.first()


def get_or_create_cart(
    db: Session, *, user_id: UUID | None = None, session_id: str | None = None
) -> Cart:
    cart = get_active_cart(db, user_id=user_id, session_id=session_id)
    if cart:
        return cart

    cart = Cart(user_id=user_id, session_id=session_id, status="active")
    db.add(cart)
    db.commit()
    db.refresh(cart)
    return cart


def get_cart_with_items(db: Session, cart_id: UUID) -> Cart | None:
    return (
        db.query(Cart)
        .options(selectinload(Cart.items).selectinload(CartItem.product))
        .filter(Cart.id == cart_id)
        .first()
    )


def add_item(db: Session, cart: Cart, product_id: UUID, quantity: int = 1) -> CartItem:
    product = product_service.get_active_product(db, product_id)
    if not product:
        raise ValueError("Product not found")

    existing = (
        db.query(CartItem)
        .filter(CartItem.cart_id == cart.id, CartItem.product_id == product_id)
        .first()
    )
    if existing:
        existing.quantity += quantity
        db.commit()
        db.refresh(existing)
        return existing

    item = CartItem(cart_id=cart.id, product_id=product_id, quantity=quantity)
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def remove_item(db: Session, cart: Cart, product_id: UUID) -> bool:
    item = (
        db.query(CartItem)
        .filter(CartItem.cart_id == cart.id, CartItem.product_id == product_id)
        .first()
    )
    if not item:
        return False
    db.delete(item)
    db.commit()
    return True


def mark_converted(db: Session, cart: Cart) -> None:
    cart.status = "converted"
    db.commit()
