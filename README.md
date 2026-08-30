
# Digital Store — setup guide

A 3-screen store for selling digital downloads (Canva templates, ebooks, PDFs), built with
Next.js + Supabase (database, file storage) + Lemon Squeezy (global card checkout, handles
3D Secure automatically). Every download link works exactly once — a second attempt tells
the buyer to purchase again.

## Screens

1. **`/`** — product catalog (public)
2. **`/checkout/[productId]`** — email/address, then hands off to payment
3. **Lemon Squeezy hosted checkout** — the actual card payment page (you never touch card
   numbers yourself, so there's no PCI compliance burden on you)
4. **`/thank-you`** — confirms payment and shows the one-time download button
5. **`/admin`** — password-gated: a plain form to add a product, and a list of products with
   sold counts

## One-time step: accounts you need to create

### 1. Supabase (free tier is enough)
1. Create a project at supabase.com.
2. Go to the SQL Editor and run everything in `supabase/schema.sql` — this creates the
   `products`/`orders` tables and the `thumbnails` (public) / `product-files` (private)
   storage buckets.
3. Go to Project Settings -> API and copy: Project URL, `anon` public key, `service_role`
   key (keep this one secret — it goes server-side only).

### 2. Lemon Squeezy
1. Create a store at lemonsqueezy.com and complete verification.
2. For each digital product, create a matching **Product + Variant** in the Lemon Squeezy
   dashboard (price, name). Copy each Variant ID — you'll paste it into the `/admin` upload
   form when you add the same product on your site, so a sale on your site opens the right
   Lemon Squeezy checkout.
3. Settings -> API: create an API key.
4. Settings -> Webhooks: add an endpoint pointing to
   `https://yourdomain.com/api/webhooks/lemonsqueezy`, subscribed to the `order_created`
   event. Copy the signing secret it gives you.
5. Under payout settings, set your payout method (bank wire to your UK account, or
   Payoneer) — see the separate payment feasibility notes for the trade-offs.

### 3. Environment variables
Copy `.env.example` to `.env.local` (for local testing) and fill in every value from steps
1–2, plus:
- `NEXT_PUBLIC_SITE_URL` — your live domain once deployed (e.g. `https://yourstore.com`)
- `ADMIN_PASSWORD` — whatever password you'll use to log into `/admin`
- `ADMIN_COOKIE_SECRET` — any long random string (used to sign the admin login cookie)

## Deploy (Vercel)

1. Push this folder to a GitHub repo.
2. Import it in vercel.com -> New Project.
3. Add all the same environment variables from `.env.local` in Vercel's Project Settings ->
   Environment Variables.
4. Deploy. Vercel gives you a `*.vercel.app` URL immediately.
5. Point your GoDaddy domain at it: in Vercel -> Project -> Settings -> Domains, add your
   domain, then in GoDaddy DNS add the CNAME/A record Vercel shows you.
6. Once the domain is live, update `NEXT_PUBLIC_SITE_URL` to the real domain and redeploy
   (Lemon Squeezy's redirect back to `/thank-you` depends on this being correct).

## Adding your first product

1. Go to `/admin`, log in with `ADMIN_PASSWORD`.
2. Fill in the form: title, description, price, the Lemon Squeezy Variant ID you created
   above, a thumbnail image, and the actual file buyers will receive.
3. It appears immediately on the homepage.

## How "pay once, download once" works

- On payment, Lemon Squeezy calls your `/api/webhooks/lemonsqueezy` endpoint.
- That handler mints a random one-time token and stores it against the order.
- The buyer's download button points at `/api/download/[token]`.
- The first request marks the token used and redirects to a 60-second signed link to the
  real file in private storage.
- Any later request with that same token is rejected with a message to purchase again.

## Local development

```bash
npm install
cp .env.example .env.local   # fill in real values
npm run dev
```

Note: Lemon Squeezy webhooks can't reach `localhost` directly — use a tool like `ngrok` to
test the full payment flow locally, or just test against your deployed Vercel URL.