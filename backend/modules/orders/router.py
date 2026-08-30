from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from database.connection import get_db
from database.serializers import order_history
from modules.orders import service as order_service

router = APIRouter(prefix="/api/order-status", tags=["orders"])


@router.get("")
def order_status(ref: str = Query(...), db: Session = Depends(get_db)):
    order = order_service.get_order_by_ref(db, ref)
    if not order:
        return {"status": "not_found"}

    if order.status == "paid":
        downloads = []
        for item in order.items:
            if not item.download_token:
                continue
            downloads.append(
                {
                    "productId": str(item.product_id),
                    "productTitle": item.product.title if item.product else "Product",
                    "downloadUrl": f"/api/download/{item.download_token}",
                    "tokenUsed": item.token_used,
                }
            )

        first = downloads[0] if downloads else None
        return {
            "status": "paid",
            "downloads": downloads,
            "downloadUrl": first["downloadUrl"] if first else None,
            "tokenUsed": first["tokenUsed"] if first else False,
        }

    return {"status": "pending"}


@router.get("/history")
def order_history_by_email(email: str = Query(...), db: Session = Depends(get_db)):
    orders = order_service.list_orders_by_email(db, email)
    return [order_history(order) for order in orders]
