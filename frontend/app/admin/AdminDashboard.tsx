"use client";

import { useState } from "react";
import type { AdminCart, AdminOrder, AdminProduct, AdminUser } from "@/lib/api";
import UploadForm from "./UploadForm";
import UsersPanel from "./UsersPanel";
import CartsPanel from "./CartsPanel";
import OrdersPanel from "./OrdersPanel";

type Tab = "products" | "users" | "carts" | "orders";

export default function AdminDashboard({
  me,
  products,
  users,
  carts,
  orders,
}: {
  me: AdminUser;
  products: AdminProduct[];
  users: AdminUser[];
  carts: AdminCart[];
  orders: AdminOrder[];
}) {
  const [tab, setTab] = useState<Tab>("products");

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST", credentials: "include" });
    window.location.reload();
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "products", label: "Products" },
    { id: "users", label: "Users" },
    { id: "carts", label: "Carts" },
    { id: "orders", label: "Orders" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Admin</h1>
          <p className="text-sm text-gray-500">
            Signed in as {me.fullName || me.email} ({me.role})
          </p>
        </div>
        <button
          type="button"
          onClick={logout}
          className="text-sm border rounded px-3 py-1.5 hover:bg-gray-50"
        >
          Log out
        </button>
      </div>

      <div className="flex flex-wrap gap-2 border-b pb-3">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-3 py-1.5 text-sm rounded ${
              tab === t.id ? "bg-brand-dark text-white" : "bg-white border hover:bg-gray-50"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "products" && (
        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <h2 className="text-lg font-medium mb-4">Add a product</h2>
            <UploadForm />
          </div>
          <div>
            <h2 className="text-lg font-medium mb-4">Products</h2>
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
      )}

      {tab === "users" && <UsersPanel users={users} />}
      {tab === "carts" && <CartsPanel carts={carts} />}
      {tab === "orders" && <OrdersPanel orders={orders} />}
    </div>
  );
}
