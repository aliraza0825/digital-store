from datetime import datetime

from modules.carts.models import Cart, CartItem
from modules.orders.models import Order, OrderItem
from modules.products.models import Product
from modules.users.models import User


def _dt(value: datetime | None) -> str | None:
    return value.isoformat() if value else None


def product_public(product: Product) -> dict:
    return {
        "id": str(product.id),
        "title": product.title,
        "description": product.description,
        "price_cents": product.price_cents,
        "currency": product.currency,
        "thumbnail_path": product.thumbnail_path,
    }


def product_admin(product: Product) -> dict:
    return {
        "id": str(product.id),
        "title": product.title,
        "description": product.description,
        "price_cents": product.price_cents,
        "currency": product.currency,
        "sold_count": product.sold_count,
        "is_active": product.is_active,
        "lemonsqueezy_variant_id": product.lemonsqueezy_variant_id,
        "created_at": _dt(product.created_at),
    }


def user_public(user: User) -> dict:
    return {
        "id": str(user.id),
        "email": user.email,
        "firstName": user.first_name,
        "lastName": user.last_name,
        "fullName": user.full_name,
        "role": user.role,
        "createdAt": _dt(user.created_at),
    }


def order_history(order: Order) -> dict:
    return {
        "id": str(order.id),
        "orderRef": order.order_ref,
        "status": order.status,
        "totalCents": order.total_cents,
        "currency": order.currency,
        "buyerEmail": order.buyer_email,
        "buyerName": order.buyer_name,
        "createdAt": _dt(order.created_at),
        "paidAt": _dt(order.paid_at),
        "userId": str(order.user_id),
        "items": [order_item_history(item) for item in order.items],
    }


def order_item_history(item: OrderItem) -> dict:
    return {
        "productId": str(item.product_id),
        "productTitle": item.product.title if item.product else "Unknown",
        "quantity": item.quantity,
        "priceCents": item.price_cents,
        "downloadToken": item.download_token,
        "tokenUsed": item.token_used,
    }


def cart_public(cart: Cart) -> dict:
    items = []
    total_cents = 0
    currency = "USD"

    for item in cart.items:
        product = item.product
        if not product:
            continue
        currency = product.currency
        total_cents += product.price_cents * item.quantity
        items.append(cart_item_public(item))

    return {
        "id": str(cart.id),
        "status": cart.status,
        "userId": str(cart.user_id) if cart.user_id else None,
        "sessionId": cart.session_id,
        "items": items,
        "total_cents": total_cents,
        "currency": currency,
        "createdAt": _dt(cart.created_at),
        "updatedAt": _dt(cart.updated_at),
    }


def cart_item_public(item: CartItem) -> dict:
    product = item.product
    return {
        "id": str(item.id),
        "product_id": str(item.product_id),
        "quantity": item.quantity,
        "product": product_public(product) if product else None,
    }
