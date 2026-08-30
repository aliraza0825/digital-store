import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { isAdminAuthed } from "@/lib/adminAuth";
import { randomUUID } from "crypto";

// Simple admin product upload — no heavy admin panel, just this one form endpoint.
export async function POST(req: NextRequest) {
  if (!isAdminAuthed()) {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const title = formData.get("title") as string;
  const description = (formData.get("description") as string) || "";
  const priceDollars = parseFloat(formData.get("price") as string);
  const variantId = formData.get("variantId") as string;
  const thumbnail = formData.get("thumbnail") as File | null;
  const file = formData.get("file") as File | null;

  if (!title || !priceDollars || !variantId || !thumbnail || !file) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const admin = supabaseAdmin();
  const id = randomUUID();

  const thumbExt = thumbnail.name.split(".").pop();
  const thumbPath = `${id}/thumbnail.${thumbExt}`;
  const { error: thumbError } = await admin.storage
    .from("thumbnails")
    .upload(thumbPath, Buffer.from(await thumbnail.arrayBuffer()), {
      contentType: thumbnail.type,
      upsert: true,
    });
  if (thumbError) {
    console.error(thumbError);
    return NextResponse.json({ error: "Thumbnail upload failed" }, { status: 500 });
  }

  const fileExt = file.name.split(".").pop();
  const filePath = `${id}/${file.name}`;
  const { error: fileError } = await admin.storage
    .from("product-files")
    .upload(filePath, Buffer.from(await file.arrayBuffer()), {
      contentType: file.type,
      upsert: true,
    });
  if (fileError) {
    console.error(fileError);
    return NextResponse.json({ error: "File upload failed" }, { status: 500 });
  }

  const { error: insertError } = await admin.from("products").insert({
    id,
    title,
    description,
    price_cents: Math.round(priceDollars * 100),
    thumbnail_path: thumbPath,
    file_path: filePath,
    lemonsqueezy_variant_id: variantId,
  });

  if (insertError) {
    console.error(insertError);
    return NextResponse.json({ error: "Could not save product" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
