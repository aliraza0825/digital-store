/** Server-side base URL for the FastAPI backend. */
export function apiBaseUrl() {
  return process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
}

export function thumbnailUrl(path: string) {
  return `${apiBaseUrl()}/api/media/thumbnails/${path}`;
}

export type Product = {
  id: string;
  title: string;
  description: string;
  price_cents: number;
  currency: string;
  thumbnail_path: string;
};

export type AdminProduct = {
  id: string;
  title: string;
  description?: string;
  price_cents: number;
  currency: string;
  sold_count: number;
  is_active: boolean;
  lemonsqueezy_variant_id?: string | null;
  created_at: string;
};

export type AdminUser = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  fullName: string | null;
  role: "admin" | "customer";
  createdAt: string;
};

export type AdminCart = {
  id: string;
  status: string;
  userId: string | null;
  sessionId: string | null;
  total_cents: number;
  currency: string;
  items: Array<{
    id: string;
    product_id: string;
    quantity: number;
    product: Product | null;
  }>;
  createdAt: string;
  updatedAt: string;
};

export type AdminOrder = {
  id: string;
  orderRef: string;
  status: string;
  totalCents: number;
  currency: string;
  buyerEmail: string;
  buyerName: string | null;
  createdAt: string;
  paidAt: string | null;
  userId: string;
  items: Array<{
    productId: string;
    productTitle: string;
    quantity: number;
    priceCents: number;
    tokenUsed: boolean;
  }>;
};

async function adminFetch<T>(path: string, cookieHeader?: string, init?: RequestInit): Promise<T | null> {
  const res = await fetch(`${apiBaseUrl()}${path}`, {
    cache: "no-store",
    ...init,
    headers: {
      ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      ...(init?.headers || {}),
    },
  });
  if (!res.ok) return null;
  return res.json();
}

export async function fetchProducts(): Promise<Product[]> {
  const res = await fetch(`${apiBaseUrl()}/api/products`, { cache: "no-store" });
  if (!res.ok) return [];
  return res.json();
}

export async function fetchProduct(id: string): Promise<Product | null> {
  const res = await fetch(`${apiBaseUrl()}/api/products/${id}`, { cache: "no-store" });
  if (!res.ok) return null;
  return res.json();
}

export async function fetchAdminMe(cookieHeader?: string): Promise<AdminUser | null> {
  return adminFetch<AdminUser>("/api/admin/me", cookieHeader);
}

export async function fetchAdminProducts(cookieHeader?: string): Promise<AdminProduct[]> {
  return (await adminFetch<AdminProduct[]>("/api/admin/products", cookieHeader)) ?? [];
}

export async function fetchAdminUsers(cookieHeader?: string): Promise<AdminUser[]> {
  return (await adminFetch<AdminUser[]>("/api/admin/users", cookieHeader)) ?? [];
}

export async function fetchAdminCarts(cookieHeader?: string): Promise<AdminCart[]> {
  return (await adminFetch<AdminCart[]>("/api/admin/carts", cookieHeader)) ?? [];
}

export async function fetchAdminOrders(cookieHeader?: string): Promise<AdminOrder[]> {
  return (await adminFetch<AdminOrder[]>("/api/admin/orders", cookieHeader)) ?? [];
}

export function formatPrice(cents: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(cents / 100);
}
