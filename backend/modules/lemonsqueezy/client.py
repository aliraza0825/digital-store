import httpx

from app.config import settings

LS_API_BASE = "https://api.lemonsqueezy.com/v1"


async def create_lemonsqueezy_checkout(
    *,
    variant_id: str,
    email: str,
    name: str | None,
    order_ref: str,
    redirect_url: str,
) -> str:
    payload = {
        "data": {
            "type": "checkouts",
            "attributes": {
                "checkout_data": {
                    "email": email,
                    "name": name or None,
                    "custom": {"order_ref": order_ref},
                },
                "product_options": {"redirect_url": redirect_url},
            },
            "relationships": {
                "store": {"data": {"type": "stores", "id": settings.lemonsqueezy_store_id}},
                "variant": {"data": {"type": "variants", "id": variant_id}},
            },
        }
    }

    async with httpx.AsyncClient() as client:
        res = await client.post(
            f"{LS_API_BASE}/checkouts",
            headers={
                "Accept": "application/vnd.api+json",
                "Content-Type": "application/vnd.api+json",
                "Authorization": f"Bearer {settings.lemonsqueezy_api_key}",
            },
            json=payload,
            timeout=30.0,
        )

    if res.status_code >= 400:
        raise RuntimeError(f"Lemon Squeezy checkout creation failed: {res.status_code} {res.text}")

    return res.json()["data"]["attributes"]["url"]
