import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { verifyLemonSqueezySignature, generateSecureToken } from "@/lib/token";

// Lemon Squeezy -> your server, fired when an order is paid.
// Configure this URL (https://yourdomain.com/api/webhooks/lemonsqueezy) under
// Lemon Squeezy dashboard -> Settings -> Webhooks, subscribed to "order_created".
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-signature");

  if (!verifyLemonSqueezySignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const payload = JSON.parse(rawBody);
  const eventName = payload?.meta?.event_name;

  if (eventName !== "order_created") {
    // Ignore anything else (subscription events, refunds, etc.) — not used by this store.
    return NextResponse.json({ ok: true });
  }

  const orderRef: string | undefined = payload?.meta?.custom_data?.order_ref;
  const lsOrderId: string | undefined = payload?.data?.id;
  const status: string | undefined = payload?.data?.attributes?.status; // "paid" expected

  if (!orderRef) {
    console.error("Webhook missing order_ref in custom_data", payload?.meta);
    return NextResponse.json({ error: "Missing order_ref" }, { status: 400 });
  }

  const admin = supabaseAdmin();

  const { data: order, error: findError } = await admin
    .from("orders")
    .select("id, product_id, status")
    .eq("order_ref", orderRef)
    .single();

  if (findError || !order) {
    console.error("Webhook: no matching order for order_ref", orderRef);
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  // Idempotency: Lemon Squeezy can retry webhook delivery — never mint a second token.
  if (order.status === "paid") {
    return NextResponse.json({ ok: true, alreadyProcessed: true });
  }

  if (status && status !== "paid") {
    // e.g. still pending/failed — don't unlock a download yet.
    return NextResponse.json({ ok: true, ignored: `status=${status}` });
  }

  const token = generateSecureToken();

  const { error: updateError } = await admin
    .from("orders")
    .update({
      status: "paid",
      download_token: token,
      lemonsqueezy_order_id: lsOrderId,
      paid_at: new Date().toISOString(),
    })
    .eq("id", order.id);

  if (updateError) {
    console.error(updateError);
    return NextResponse.json({ error: "Could not finalize order" }, { status: 500 });
  }

  const { error: rpcError } = await admin.rpc("increment_sold_count", { pid: order.product_id });
  if (rpcError) console.error("Failed to increment sold_count", rpcError);

  return NextResponse.json({ ok: true });
}
