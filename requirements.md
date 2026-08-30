# Project Status — Digital Products Store

Last updated: August 2026

## Architecture

- **Frontend:** Next.js 14 (`frontend/`) + React + Tailwind CSS
- **Backend:** FastAPI monolith (`backend/`) with PostgreSQL (local install, no Docker required)
- **Payments:** Lemon Squeezy (hosted checkout + webhooks)
- **File storage:** Local filesystem (`backend/storage/`)

### Backend layout

```
backend/
  app/           — FastAPI app entry + settings/config
  database/      — PostgreSQL connection, SQLAlchemy models, schema.sql
  modules/       — Feature modules (products, orders, checkout, webhooks, admin, download, auth, storage)
  storage/       — Uploaded thumbnails and product files (gitignored)
  .env           — Local environment variables
```

### Frontend layout

```
frontend/
  app/           — Next.js pages (catalog, checkout, thank-you, admin)
  lib/           — API client + admin auth helpers
  .env.local     — Frontend env vars (API URL, site URL)
```

## What's already built (code side — done)

**Screen 1 — Product catalog** (`frontend/app/page.tsx`)
Public homepage, reads products from FastAPI, shows title/thumbnail/price, links to checkout.

**Screen 2 — Checkout / address** (`frontend/app/checkout/[productId]/`)
Collects buyer email (required), name and address (optional), then calls `/api/checkout` (proxied to FastAPI).

**`/api/checkout`** (FastAPI: `backend/modules/checkout/`)
Creates a pending order in PostgreSQL, creates a Lemon Squeezy hosted checkout, returns the URL.
Fails gracefully if Lemon Squeezy Variant ID is missing.

**Screen 3 — Payment** — Lemon Squeezy hosted checkout (no custom code).

**`/api/webhooks/lemonsqueezy`** (FastAPI: `backend/modules/webhooks/`)
Verifies signature, handles `order_created`, mints one-time token, marks order paid, increments sold count. Idempotent.

**`/thank-you`** — Polls `/api/order-status` until webhook completes, then shows download button.

**`/api/download/[token]`** (FastAPI: `backend/modules/download/`)
Pay-once-download-once enforcement.

**Admin panel** (`frontend/app/admin/`)
Role-gated (`users.role = admin`). Admins can manage products, users (roles), carts, and orders.
An initial admin is seeded from `ADMIN_EMAIL` / `ADMIN_PASSWORD` on backend startup.

**Database** (`backend/database/schema.sql`) — `users` (with `role`, `first_name`, `last_name`), `products`, `carts`, `cart_items`, `orders`, and `order_items`. Buyers are tracked by email (customer user created on checkout). Carts support session-based shopping; order history is available via `/api/order-status/history?email=...`.

## What's left to reach a fully working live site

1. **Install PostgreSQL locally** and run `backend/database/schema.sql`.
2. **Fill in `backend/.env`** — database URL, Lemon Squeezy keys, admin password.
3. **Fill in `frontend/.env.local`** — API URL, site URL, admin cookie secret.
4. **Start backend:** `cd backend && ./run.sh`
5. **Start frontend:** `cd frontend && npm run dev`
6. **Deploy** frontend (Vercel) and backend (Railway, Fly.io, Render, VPS, etc.) with production env vars.
7. **Connect domain** and update Lemon Squeezy webhook URL to live backend.
8. **Finish Lemon Squeezy verification** and switch currency to USD.
9. **End-to-end test** with Lemon Squeezy test mode.

## Local development quick start

```bash
# PostgreSQL (one-time)
createdb digital_store
psql digital_store -f backend/database/schema.sql

# Backend
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
./run.sh

# Frontend (separate terminal)
cd frontend
npm install
npm run dev
```

Note: Use `ngrok http 8000` to test Lemon Squeezy webhooks locally.
