from fastapi import APIRouter, Depends
from fastapi.responses import FileResponse, PlainTextResponse
from sqlalchemy.orm import Session

from database.connection import get_db
from modules.orders import service as order_service
from modules.storage.service import resolve_product_file_path

router = APIRouter(prefix="/api/download", tags=["download"])


@router.get("/{token}")
def download_file(token: str, db: Session = Depends(get_db)):
    order_item = order_service.get_order_item_by_token(db, token)

    if not order_item or not order_item.order or order_item.order.status != "paid":
        return PlainTextResponse("Invalid or expired download link.", status_code=404)

    if order_item.token_used:
        return PlainTextResponse(
            "This download link has already been used. Please purchase again to download the file another time.",
            status_code=410,
        )

    product = order_item.product
    if not product:
        return PlainTextResponse("File not found.", status_code=404)

    file_path = resolve_product_file_path(product.file_path)
    if not file_path.is_file():
        return PlainTextResponse(
            "Could not generate download link. Please try again.", status_code=500
        )

    order_service.mark_token_used(db, order_item)
    return FileResponse(
        file_path,
        filename=file_path.name,
        media_type="application/octet-stream",
    )
