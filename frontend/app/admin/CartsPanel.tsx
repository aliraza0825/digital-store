"use client";

import type { AdminCart } from "@/lib/api";
import { formatPrice } from "@/lib/api";
import { useState } from "react";

export default function CartsPanel({ carts }: { carts: AdminCart[] }) {
  const [list, setList] = useState(carts);

  async function refresh() {
    const res = await fetch("/api/admin/carts", { credentials: "include" });
    if (res.ok) setList(await res.json());
  }

  async function removeItem(cartId: string, productId: string) {
    const res = await fetch(`/api/admin/carts/${cartId}/items/${productId}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (res.ok) await refresh();
  }

  async function deleteCart(cartId: string) {
    if (!confirm("Delete this cart?")) return;
    const res = await fetch(`/api/admin/carts/${cartId}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (res.ok) await refresh();
  }

  return (
    <div className="bg-white border rounded-lg divide-y">
      {list.length === 0 && <p className="p-4 text-sm text-gray-500">No carts yet.</p>}
      {list.map((cart) => (
        <div key={cart.id} className="p-4 text-sm space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-medium">Cart {cart.id.slice(0, 8)}…</p>
              <p className="text-gray-500">
                {cart.status} · {formatPrice(cart.total_cents, cart.currency)} ·{" "}
                {cart.items.length} item(s)
              </p>
              {cart.sessionId && <p className="text-xs text-gray-400">Session: {cart.sessionId}</p>}
            </div>
            <button
              type="button"
              onClick={() => deleteCart(cart.id)}
              className="text-xs text-red-600 hover:underline"
            >
              Delete cart
            </button>
          </div>
          <ul className="space-y-2">
            {cart.items.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-3 border rounded px-3 py-2">
                <span>
                  {item.product?.title || item.product_id} × {item.quantity}
                </span>
                <button
                  type="button"
                  onClick={() => removeItem(cart.id, item.product_id)}
                  className="text-xs text-red-600 hover:underline"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
