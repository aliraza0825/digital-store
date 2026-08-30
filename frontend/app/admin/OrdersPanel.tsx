"use client";

import type { AdminOrder } from "@/lib/api";
import { formatPrice } from "@/lib/api";

export default function OrdersPanel({ orders }: { orders: AdminOrder[] }) {
  return (
    <div className="bg-white border rounded-lg divide-y">
      {orders.length === 0 && <p className="p-4 text-sm text-gray-500">No orders yet.</p>}
      {orders.map((order) => (
        <div key={order.id} className="p-4 text-sm space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-medium">{order.buyerEmail}</p>
              <p className="text-gray-500">
                {order.status} · {formatPrice(order.totalCents, order.currency)} · ref{" "}
                {order.orderRef.slice(0, 10)}…
              </p>
            </div>
            <p className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleString()}</p>
          </div>
          <ul className="text-gray-600 space-y-1">
            {order.items.map((item) => (
              <li key={`${order.id}-${item.productId}`}>
                {item.productTitle} × {item.quantity}
                {item.tokenUsed ? " · downloaded" : ""}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
