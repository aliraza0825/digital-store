// Minimal Lemon Squeezy API helper — just enough to create a hosted checkout.
// Docs: https://docs.lemonsqueezy.com/api/checkouts

const LS_API_BASE = "https://api.lemonsqueezy.com/v1";

export async function createLemonSqueezyCheckout(opts: {
  variantId: string;
  email: string;
  name?: string;
  orderRef: string;
  redirectUrl: string;
}) {
  const res = await fetch(`${LS_API_BASE}/checkouts`, {
    method: "POST",
    headers: {
      Accept: "application/vnd.api+json",
      "Content-Type": "application/vnd.api+json",
      Authorization: `Bearer ${process.env.LEMONSQUEEZY_API_KEY}`,
    },
    body: JSON.stringify({
      data: {
        type: "checkouts",
        attributes: {
          checkout_data: {
            email: opts.email,
            name: opts.name || undefined,
            custom: { order_ref: opts.orderRef },
          },
          product_options: {
            redirect_url: opts.redirectUrl,
          },
        },
        relationships: {
          store: {
            data: { type: "stores", id: process.env.LEMONSQUEEZY_STORE_ID },
          },
          variant: {
            data: { type: "variants", id: opts.variantId },
          },
        },
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Lemon Squeezy checkout creation failed: ${res.status} ${body}`);
  }

  const json = await res.json();
  return json.data.attributes.url as string;
}
