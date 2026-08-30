from uuid import UUID

from fastapi import APIRouter, Body, Depends, HTTPException
from sqlalchemy.orm import Session

from app.config import settings
from database.connection import get_db
from modules.lemonsqueezy.client import create_lemonsqueezy_checkout
from modules.orders import service as order_service
from modules.products import service as product_service

router = APIRouter(prefix="/api/checkout", tags=["checkout"])


@router.post("")
async def start_checkout(
    productId: str = Body(...),
    email: str = Body(...),
    name: str | None = Body(None),
    address: str | None = Body(None),
    db: Session = Depends(get_db),
):
    if not productId or not email:
        raise HTTPException(status_code=400, detail="Missing productId or email")

    try:
        product_id = UUID(productId)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid productId")

    product = product_service.get_active_product(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    if not product.lemonsqueezy_variant_id:
        raise HTTPException(
            status_code=400,
            detail="This product is not ready for checkout yet (missing Lemon Squeezy Variant ID).",
        )

    order_ref = order_service.create_pending_order(
        db,
        product=product,
        buyer_email=email,
        buyer_name=name,
        buyer_address=address,
    )

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

    return {"checkoutUrl": checkout_url}
