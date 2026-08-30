from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy.orm import Session, selectinload

from modules.carts.models import Cart
from modules.orders.models import Order, OrderItem
from modules.products.models import Product
from modules.auth.service import generate_order_ref, generate_secure_token
from modules.products.service import increment_sold_count
from modules.users import service as user_service


def create_pending_order(
    db: Session,
    *,
    product: Product,
    buyer_email: str,
    buyer_name: str | None,
    buyer_address: str | None,
) -> str:
    user = user_service.get_or_create(db, email=buyer_email, name=buyer_name)
    order_ref = generate_order_ref()

    order = Order(
        user_id=user.id,
        order_ref=order_ref,
        buyer_email=buyer_email,
        buyer_name=buyer_name,
        buyer_address=buyer_address,
        total_cents=product.price_cents,
        currency=product.currency,
        status="pending",
    )
    db.add(order)
    db.flush()

    db.add(
        OrderItem(
            order_id=order.id,
            product_id=product.id,
            quantity=1,
            price_cents=product.price_cents,
        )
    )
    db.commit()
    return order_ref


def create_pending_order_from_cart(
    db: Session,
    *,
    cart: Cart,
    buyer_email: str,
    buyer_name: str | None,
    buyer_address: str | None,
) -> str:
    if not cart.items:
        raise ValueError("Cart is empty")

    user = user_service.get_or_create(db, email=buyer_email, name=buyer_name)
    order_ref = generate_order_ref()

    total_cents = 0
    currency = "USD"
    order_items: list[OrderItem] = []

    for cart_item in cart.items:
        product = db.get(Product, cart_item.product_id)
        if not product or not product.is_active:
            raise ValueError("One or more cart products are unavailable")
        currency = product.currency
        line_total = product.price_cents * cart_item.quantity
        total_cents += line_total
        order_items.append(
            OrderItem(
                product_id=product.id,
                quantity=cart_item.quantity,
                price_cents=product.price_cents,
            )
        )

    order = Order(
        user_id=user.id,
        order_ref=order_ref,
        buyer_email=buyer_email,
        buyer_name=buyer_name,
        buyer_address=buyer_address,
        total_cents=total_cents,
        currency=currency,
        status="pending",
    )
    db.add(order)
    db.flush()

    for item in order_items:
        item.order_id = order.id
        db.add(item)

    db.commit()
    return order_ref


def get_order_by_ref(db: Session, order_ref: str) -> Order | None:
    return (
        db.query(Order)
        .options(selectinload(Order.items).selectinload(OrderItem.product))
        .filter(Order.order_ref == order_ref)
        .first()
    )


def get_order_item_by_token(db: Session, token: str) -> OrderItem | None:
    return (
        db.query(OrderItem)
        .options(selectinload(OrderItem.order), selectinload(OrderItem.product))
        .filter(OrderItem.download_token == token)
        .first()
    )


def list_orders_by_email(db: Session, email: str) -> list[Order]:
    user = user_service.get_by_email(db, email)
    if not user:
        return []

    return (
        db.query(Order)
        .options(selectinload(Order.items).selectinload(OrderItem.product))
        .filter(Order.user_id == user.id)
        .order_by(Order.created_at.desc())
        .all()
    )


def finalize_paid_order(
    db: Session,
    order: Order,
    *,
    lemonsqueezy_order_id: str | None,
) -> None:
    order.status = "paid"
    order.lemonsqueezy_order_id = lemonsqueezy_order_id
    order.paid_at = datetime.now(timezone.utc)

    for item in order.items:
        item.download_token = generate_secure_token()
        increment_sold_count(db, item.product_id, item.quantity)

    db.commit()


def mark_token_used(db: Session, order_item: OrderItem) -> None:
    order_item.token_used = True
    db.commit()
