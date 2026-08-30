from uuid import UUID

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.config import settings
from database.connection import get_db
from modules.products.models import Product
from database.serializers import cart_public
from modules.carts import service as cart_service
from modules.lemonsqueezy.client import create_lemonsqueezy_checkout
from modules.orders import service as order_service

router = APIRouter(prefix="/api/cart", tags=["cart"])


@router.get("")
def get_cart(sessionId: str = Query(...), db: Session = Depends(get_db)):
    cart = cart_service.get_or_create_cart(db, session_id=sessionId)
    cart = cart_service.get_cart_with_items(db, cart.id)
    return cart_public(cart)


@router.post("/items")
def add_to_cart(
    productId: str = Body(...),
    sessionId: str = Body(...),
    quantity: int = Body(1),
    db: Session = Depends(get_db),
):
    if not sessionId:
        raise HTTPException(status_code=400, detail="sessionId is required")

    try:
        product_id = UUID(productId)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid productId")

    cart = cart_service.get_or_create_cart(db, session_id=sessionId)
    try:
        cart_service.add_item(db, cart, product_id, max(1, quantity))
    except ValueError:
        raise HTTPException(status_code=404, detail="Product not found")

    cart = cart_service.get_cart_with_items(db, cart.id)
    return cart_public(cart)


@router.delete("/items/{product_id}")
def remove_from_cart(
    product_id: UUID,
    sessionId: str = Query(...),
    db: Session = Depends(get_db),
):
    cart = cart_service.get_active_cart(db, session_id=sessionId)
    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")

    cart_service.remove_item(db, cart, product_id)
    cart = cart_service.get_cart_with_items(db, cart.id)
    return cart_public(cart)


@router.post("/checkout")
async def checkout_cart(
    email: str = Body(...),
    sessionId: str = Body(...),
    name: str | None = Body(None),
    address: str | None = Body(None),
    db: Session = Depends(get_db),
):
    cart = cart_service.get_active_cart(db, session_id=sessionId)
    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")

    cart = cart_service.get_cart_with_items(db, cart.id)
    if not cart.items:
        raise HTTPException(status_code=400, detail="Cart is empty")

    try:
        order_ref = order_service.create_pending_order_from_cart(
            db,
            cart=cart,
            buyer_email=email,
            buyer_name=name,
            buyer_address=address,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    first_item = cart.items[0]
    product = db.get(Product, first_item.product_id)
    if not product or not product.lemonsqueezy_variant_id:
        raise HTTPException(status_code=400, detail="Product is not ready for checkout")

    try:
        checkout_url = await create_lemonsqueezy_checkout(
            variant_id=product.lemonsqueezy_variant_id,
            email=email,
            name=name,
            order_ref=order_ref,
            redirect_url=f"{settings.site_url}/thank-you?ref={order_ref}",
        )
    except Exception:
        raise HTTPException(status_code=500, detail="Could not create checkout")

    cart_service.mark_converted(db, cart)
    return {"checkoutUrl": checkout_url}
