from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database.connection import get_db
from database.serializers import product_public
from modules.products import service

router = APIRouter(prefix="/api/products", tags=["products"])


@router.get("")
def list_products(db: Session = Depends(get_db)):
    products = service.list_active_products(db)
    return [product_public(p) for p in products]


@router.get("/{product_id}")
def get_product(product_id: UUID, db: Session = Depends(get_db)):
    product = service.get_active_product(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product_public(product)
