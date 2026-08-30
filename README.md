
# Digital Store — setup guide

A 3-screen store for selling digital downloads (Canva templates, ebooks, PDFs).

- **Frontend:** Next.js + Tailwind CSS (`frontend/`)
- **Backend:** FastAPI monolith + PostgreSQL (`backend/`)
- **Payments:** Lemon Squeezy (global card checkout, handles 3D Secure automatically)

Every download link works exactly once — a second attempt tells the buyer to purchase again.

## Project structure

```
digital-store/
  frontend/            — Next.js app (pages, components, API proxy)
  backend/
    app/               — FastAPI entry + settings/config
    database/          — PostgreSQL connection, models, schema.sql
    modules/           — Feature modules (products, orders, checkout, admin, webhooks, download)
    storage/           — Local file storage (thumbnails + product files)
    .env               — Backend environment variables (local dev)
```

## Screens

1. **`/`** — product catalog (public)
2. **`/checkout/[productId]`** — email/address, then hands off to payment
3. **Lemon Squeezy hosted checkout** — card payment page
4. **`/thank-you`** — confirms payment and shows the one-time download button
5. **`/admin`** — password-gated product upload + sold counts

## One-time setup

### 1. PostgreSQL (local install)

Install PostgreSQL on your machine, create a database, then run the schema once:

```bash
createdb digital_store
psql digital_store -f backend/database/schema.sql
```

Update `DATABASE_URL` in `backend/.env` if your local Postgres user/password differs.

### 2. Lemon Squeezy

1. Create a store at lemonsqueezy.com and complete verification.
2. For each product, create a matching **Product + Variant** in Lemon Squeezy and copy the Variant ID.
3. Settings → API: create an API key.
4. Settings → Webhooks: point to `https://your-backend-domain.com/api/webhooks/lemonsqueezy`
   (event: `order_created`). Copy the signing secret into `backend/.env`.

### 3. Environment variables

**Backend** — edit `backend/.env` (already created for local dev):

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string |
| `SITE_URL` | Public frontend URL (checkout redirect) |
| `LEMONSQUEEZY_*` | Payment API keys |
| `ADMIN_EMAIL` | Seeded admin user email (role=`admin`) |
| `ADMIN_PASSWORD` | Seeded admin user password |
| `ADMIN_COOKIE_SECRET` | Signs the login session cookie |
| `CORS_ORIGINS` | Frontend origin(s), e.g. `http://localhost:3000` |

**Frontend** — copy `frontend/.env.example` to `frontend/.env.local`:

| Variable | Purpose |
|----------|---------|
| `API_URL` | FastAPI backend URL (server-side + rewrites) |
| `NEXT_PUBLIC_API_URL` | Same URL, exposed to browser for thumbnails |
| `NEXT_PUBLIC_SITE_URL` | Public site URL |

The frontend proxies all `/api/*` requests to FastAPI via `frontend/next.config.mjs`.

## Local development

```bash
# Terminal 1 — Backend (FastAPI + uvicorn)
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
./run.sh

# Terminal 2 — Frontend (Next.js)
cd frontend
cp .env.example .env.local   # if not already present
npm install
npm run dev
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API docs: http://localhost:8000/docs

Note: Lemon Squeezy webhooks can't reach `localhost` — use `ngrok` on port 8000 or test on a deployed backend.

## Adding your first product

1. Go to http://localhost:3000/admin and log in with `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `backend/.env`.
2. Use the admin tabs to manage products, users, carts, and orders.
3. New products appear on the homepage immediately.

## How "pay once, download once" works

- Lemon Squeezy calls `/api/webhooks/lemonsqueezy` after payment.
- The handler mints a one-time download token on the order.
- The buyer's button points at `/api/download/[token]`.
- First request serves the file and burns the token; any retry is rejected.
