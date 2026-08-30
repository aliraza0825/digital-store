import json

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.config import settings
from database.connection import get_db
from modules.auth.service import verify_lemonsqueezy_signature
from modules.orders import service as order_service

router = APIRouter(prefix="/api/webhooks/lemonsqueezy", tags=["webhooks"])


@router.post("")
async def lemonsqueezy_webhook(request: Request, db: Session = Depends(get_db)):
    raw_body = await request.body()
    signature = request.headers.get("x-signature")

    if not verify_lemonsqueezy_signature(
        raw_body, signature, settings.lemonsqueezy_webhook_secret
    ):
        raise HTTPException(status_code=401, detail="Invalid signature")

    payload = json.loads(raw_body)
    event_name = payload.get("meta", {}).get("event_name")

    if event_name != "order_created":
        return {"ok": True}

    order_ref = payload.get("meta", {}).get("custom_data", {}).get("order_ref")
    ls_order_id = payload.get("data", {}).get("id")
    status = payload.get("data", {}).get("attributes", {}).get("status")

    if not order_ref:
        raise HTTPException(status_code=400, detail="Missing order_ref")

    order = order_service.get_order_by_ref(db, order_ref)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if order.status == "paid":
        return {"ok": True, "alreadyProcessed": True}

    if status and status != "paid":
        return {"ok": True, "ignored": f"status={status}"}

    if not order.items:
        raise HTTPException(status_code=404, detail="Order has no items")

    order_service.finalize_paid_order(db, order, lemonsqueezy_order_id=ls_order_id)
    return {"ok": True}
