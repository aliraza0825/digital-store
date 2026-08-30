import uuid
from uuid import UUID

from fastapi import APIRouter, Body, Depends, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session, selectinload

from database.connection import get_db
from database.serializers import cart_public, order_history, product_admin, user_public
from modules.auth.dependencies import require_admin
from modules.carts.models import Cart, CartItem
from modules.carts import service as cart_service
from modules.orders.models import Order, OrderItem
from modules.products.models import Product
from modules.products import service as product_service
from modules.storage.service import save_product_file, save_thumbnail
from modules.users import service as user_service
from modules.users.models import User

router = APIRouter(prefix="/api/admin", tags=["admin"])


# ── Products ───────────────────────────────────────────────────────────────


@router.get("/products", dependencies=[Depends(require_admin)])
def admin_list_products(db: Session = Depends(get_db)):
    return [product_admin(p) for p in product_service.list_all_products(db)]


@router.post("/products", dependencies=[Depends(require_admin)])
async def admin_create_product(
    title: str = Form(...),
    description: str = Form(""),
    price: float = Form(...),
    variantId: str | None = Form(None),  # optional — a product can be listed before its
                                          # Lemon Squeezy variant exists; checkout blocks
                                          # gracefully until this is filled in later.
    thumbnail: UploadFile = ...,
    file: UploadFile = ...,
    db: Session = Depends(get_db),
):
    if not title or not price or not thumbnail.filename or not file.filename:
        raise HTTPException(status_code=400, detail="Missing required fields")

    product_id = uuid.uuid4()
    thumb_path = save_thumbnail(product_id, thumbnail)
    file_path = save_product_file(product_id, file)

    product = Product(
        id=product_id,
        title=title,
        description=description,
        price_cents=round(price * 100),
        thumbnail_path=thumb_path,
        file_path=file_path,
        lemonsqueezy_variant_id=variantId or None,
    )
    db.add(product)
    db.commit()
    return {"ok": True}


@router.patch("/products/{product_id}", dependencies=[Depends(require_admin)])
def admin_update_product(
    product_id: UUID,
    title: str | None = Body(None),
    description: str | None = Body(None),
    price: float | None = Body(None),
    variantId: str | None = Body(None),
    isActive: bool | None = Body(None),
    db: Session = Depends(get_db),
):
    product = db.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    if title is not None:
        product.title = title
    if description is not None:
        product.description = description
    if price is not None:
        product.price_cents = round(price * 100)
    if variantId is not None:
        product.lemonsqueezy_variant_id = variantId or None
    if isActive is not None:
        product.is_active = isActive

    db.commit()
    return product_admin(product)


@router.delete("/products/{product_id}", dependencies=[Depends(require_admin)])
def admin_delete_product(product_id: UUID, db: Session = Depends(get_db)):
    product = db.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    product.is_active = False
    db.commit()
    return {"ok": True}


# ── Users ──────────────────────────────────────────────────────────────────


@router.get("/users", dependencies=[Depends(require_admin)])
def admin_list_users(db: Session = Depends(get_db)):
    return [user_public(u) for u in user_service.list_users(db)]


@router.post("/users", dependencies=[Depends(require_admin)])
def admin_create_user(
    email: str = Body(...),
    firstName: str | None = Body(None),
    lastName: str | None = Body(None),
    role: str = Body("customer"),
    password: str | None = Body(None),
    db: Session = Depends(get_db),
):
    if role == "admin" and not password:
        raise HTTPException(status_code=400, detail="Admin users require a password")
    try:
        user = user_service.create_user(
            db,
            email=email,
            first_name=firstName,
            last_name=lastName,
            role=role,
            password=password,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    return user_public(user)


@router.patch("/users/{user_id}")
def admin_update_user(
    user_id: UUID,
    firstName: str | None = Body(None),
    lastName: str | None = Body(None),
    role: str | None = Body(None),
    password: str | None = Body(None),
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    user = user_service.get_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.id == current_admin.id and role and role != "admin":
        raise HTTPException(status_code=400, detail="Cannot remove your own admin role")

    try:
        user = user_service.update_user(
            db,
            user,
            first_name=firstName,
            last_name=lastName,
            role=role,
            password=password,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    return user_public(user)


@router.delete("/users/{user_id}")
def admin_delete_user(
    user_id: UUID,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    if user_id == current_admin.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")

    user = user_service.get_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user_service.delete_user(db, user)
    return {"ok": True}


# ── Carts ──────────────────────────────────────────────────────────────────


@router.get("/carts", dependencies=[Depends(require_admin)])
def admin_list_carts(db: Session = Depends(get_db)):
    carts = (
        db.query(Cart)
        .options(selectinload(Cart.items).selectinload(CartItem.product))
        .order_by(Cart.updated_at.desc())
        .all()
    )
    return [cart_public(c) for c in carts]


@router.delete("/carts/{cart_id}", dependencies=[Depends(require_admin)])
def admin_delete_cart(cart_id: UUID, db: Session = Depends(get_db)):
    cart = db.get(Cart, cart_id)
    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")
    db.delete(cart)
    db.commit()
    return {"ok": True}


@router.delete("/carts/{cart_id}/items/{product_id}", dependencies=[Depends(require_admin)])
def admin_remove_cart_item(
    cart_id: UUID,
    product_id: UUID,
    db: Session = Depends(get_db),
):
    cart = cart_service.get_cart_with_items(db, cart_id)
    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")
    cart_service.remove_item(db, cart, product_id)
    cart = cart_service.get_cart_with_items(db, cart_id)
    return cart_public(cart)


# ── Orders ─────────────────────────────────────────────────────────────────


@router.get("/orders", dependencies=[Depends(require_admin)])
def admin_list_orders(db: Session = Depends(get_db)):
    orders = (
        db.query(Order)
        .options(selectinload(Order.items).selectinload(OrderItem.product))
        .order_by(Order.created_at.desc())
        .all()
    )
    return [order_history(o) for o in orders]
