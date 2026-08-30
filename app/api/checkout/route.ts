import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { createLemonSqueezyCheckout } from "@/lib/lemonsqueezy";
import { generateOrderRef } from "@/lib/token";

// Creates a pending order + a Lemon Squeezy hosted checkout, and hands the
// checkout URL back to the browser (Screen 2 -> Screen 3 handoff).
export async function POST(req: NextRequest) {
  const { productId, email, name, address } = await req.json();

  if (!productId || !email) {
    return NextResponse.json({ error: "Missing productId or email" }, { status: 400 });
  }

  const admin = supabaseAdmin();

  const { data: product, error: productError } = await admin
    .from("products")
    .select("id, lemonsqueezy_variant_id, is_active")
    .eq("id", productId)
    .single();

  if (productError || !product || !product.is_active) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const orderRef = generateOrderRef();

  const { error: insertError } = await admin.from("orders").insert({
    product_id: product.id,
    order_ref: orderRef,
    buyer_email: email,
    buyer_name: name || null,
    buyer_address: address || null,
    status: "pending",
  });

  if (insertError) {
    console.error(insertError);
    return NextResponse.json({ error: "Could not start order" }, { status: 500 });
  }

  try {
    const checkoutUrl = await createLemonSqueezyCheckout({
      variantId: product.lemonsqueezy_variant_id,
      email,
      name,
      orderRef,
      redirectUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/thank-you?ref=${orderRef}`,
    });
    return NextResponse.json({ checkoutUrl });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Could not create checkout" }, { status: 500 });
  }
}
