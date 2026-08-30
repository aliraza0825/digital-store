import { supabasePublic } from "@/lib/supabase";
import { notFound } from "next/navigation";
import CheckoutForm from "./CheckoutForm";

function thumbnailUrl(path: string) {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return `${base}/storage/v1/object/public/thumbnails/${path}`;
}

function formatPrice(cents: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(cents / 100);
}

// Screen 2 — checkout / address, before handing off to payment
export default async function CheckoutPage({ params }: { params: { productId: string } }) {
  const { data: product } = await supabasePublic
    .from("products")
    .select("id, title, price_cents, currency, thumbnail_path")
    .eq("id", params.productId)
    .eq("is_active", true)
    .single();

  if (!product) notFound();

  return (
    <div className="max-w-lg mx-auto bg-white border rounded-lg p-6">
      <div className="flex gap-4 items-center border-b pb-4 mb-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={thumbnailUrl(product.thumbnail_path)}
          alt={product.title}
          className="w-20 h-20 object-cover rounded bg-gray-100"
        />
        <div>
          <h1 className="font-medium">{product.title}</h1>
          <p className="text-gray-600">{formatPrice(product.price_cents, product.currency)}</p>
        </div>
      </div>
      <CheckoutForm productId={product.id} />
    </div>
  );
}
