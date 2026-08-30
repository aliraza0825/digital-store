import { isAdminAuthed } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabase";
import AdminLogin from "./AdminLogin";
import UploadForm from "./UploadForm";

export const revalidate = 0;

async function getProducts() {
  const admin = supabaseAdmin();
  const { data } = await admin
    .from("products")
    .select("id, title, price_cents, currency, sold_count, is_active, created_at")
    .order("created_at", { ascending: false });
  return data ?? [];
}

// Screen: /admin — password gate, then a plain upload form + a product/sold-count list.
// Deliberately not a "full" admin panel — just enough to add products and see what's selling.
export default async function AdminPage() {
  const authed = isAdminAuthed();

  if (!authed) {
    return <AdminLogin />;
  }

  const products = await getProducts();

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div>
        <h1 className="text-xl font-semibold mb-4">Add a product</h1>
        <UploadForm />
      </div>
      <div>
        <h1 className="text-xl font-semibold mb-4">Products</h1>
        <div className="bg-white border rounded-lg divide-y">
          {products.length === 0 && (
            <p className="p-4 text-sm text-gray-500">No products yet.</p>
          )}
          {products.map((p) => (
            <div key={p.id} className="p-4 flex items-center justify-between text-sm">
              <div>
                <p className="font-medium">{p.title}</p>
                <p className="text-gray-500">
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: p.currency,
                  }).format(p.price_cents / 100)}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold">{p.sold_count} sold</p>
                {!p.is_active && <p className="text-xs text-red-500">inactive</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
