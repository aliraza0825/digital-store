import { fetchProduct, formatPrice, thumbnailUrl } from "@/lib/api";
import { notFound } from "next/navigation";
import CheckoutForm from "./CheckoutForm";

export default async function CheckoutPage({ params }: { params: { productId: string } }) {
  const product = await fetchProduct(params.productId);

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
