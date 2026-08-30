import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// Polled by the thank-you page while it waits for the Lemon Squeezy webhook
// to finish confirming payment and minting the one-time download token.
export async function GET(req: NextRequest) {
  const ref = req.nextUrl.searchParams.get("ref");
  if (!ref) return NextResponse.json({ error: "Missing ref" }, { status: 400 });

  const admin = supabaseAdmin();
  const { data: order } = await admin
    .from("orders")
    .select("status, download_token, token_used")
    .eq("order_ref", ref)
    .single();

  if (!order) return NextResponse.json({ status: "not_found" });

  if (order.status === "paid" && order.download_token) {
    return NextResponse.json({
      status: "paid",
      downloadUrl: `/api/download/${order.download_token}`,
      tokenUsed: order.token_used,
    });
  }

  return NextResponse.json({ status: "pending" });
}
