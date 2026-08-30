import { fetchProducts, formatPrice, thumbnailUrl } from "@/lib/api";

export const revalidate = 0;

export default async function HomePage() {
  const products = await fetchProducts();

  if (products.length === 0) {
    return (
      <p className="text-gray-500 text-center py-20">
        No products yet — check back soon.
      </p>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">All products</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {products.map((p) => (
          <a
            key={p.id}
            href={`/checkout/${p.id}`}
            className="block bg-white border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={thumbnailUrl(p.thumbnail_path)}
              alt={p.title}
              className="w-full aspect-[4/3] object-cover bg-gray-100"
            />
            <div className="p-4">
              <h2 className="font-medium mb-1">{p.title}</h2>
              <p className="text-sm text-gray-500 line-clamp-2 mb-3">{p.description}</p>
              <div className="flex items-center justify-between">
                <span className="font-semibold">{formatPrice(p.price_cents, p.currency)}</span>
                <span className="text-sm text-brand-dark font-medium">Buy →</span>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
