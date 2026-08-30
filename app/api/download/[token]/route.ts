import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// The core "pay once, download once" rule lives here.
export async function GET(_req: NextRequest, { params }: { params: { token: string } }) {
  const admin = supabaseAdmin();

  const { data: order, error } = await admin
    .from("orders")
    .select("id, product_id, status, token_used")
    .eq("download_token", params.token)
    .single();

  if (error || !order || order.status !== "paid") {
    return new NextResponse("Invalid or expired download link.", { status: 404 });
  }

  if (order.token_used) {
    return new NextResponse(
      "This download link has already been used. Please purchase again to download the file another time.",
      { status: 410 }
    );
  }

  const { data: product } = await admin
    .from("products")
    .select("file_path")
    .eq("id", order.product_id)
    .single();

  if (!product) {
    return new NextResponse("File not found.", { status: 404 });
  }

  const { data: signed, error: signError } = await admin.storage
    .from("product-files")
    .createSignedUrl(product.file_path, 60); // 60-second window to actually fetch the file

  if (signError || !signed) {
    console.error(signError);
    return new NextResponse("Could not generate download link. Please try again.", { status: 500 });
  }

  // Burn the token now that the signed URL exists — a retry after this point
  // is treated as "already downloaded", which is the intended behavior.
  const { error: updateError } = await admin
    .from("orders")
    .update({ token_used: true })
    .eq("id", order.id);

  if (updateError) {
    console.error(updateError);
    return new NextResponse("Something went wrong. Please contact support.", { status: 500 });
  }

  return NextResponse.redirect(signed.signedUrl);
}
