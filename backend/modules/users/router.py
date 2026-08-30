from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, selectinload

from database.connection import get_db
from modules.orders.models import Order, OrderItem
from modules.users.models import User
from database.serializers import order_history, user_public

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("/by-email")
def get_user_by_email(email: str = Query(...), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == email.lower().strip()).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user_public(user)


@router.get("/{user_id}/orders")
def get_user_orders(user_id: UUID, db: Session = Depends(get_db)):
    orders = (
        db.query(Order)
        .options(selectinload(Order.items).selectinload(OrderItem.product))
        .filter(Order.user_id == user_id)
        .order_by(Order.created_at.desc())
        .all()
    )
    return [order_history(order) for order in orders]
