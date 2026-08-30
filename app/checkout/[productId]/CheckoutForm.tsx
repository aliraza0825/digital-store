"use client";

import { useState } from "react";

export default function CheckoutForm({ productId }: { productId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const payload = {
      productId,
      email: formData.get("email"),
      name: formData.get("name"),
      address: formData.get("address"),
    };

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      const { checkoutUrl } = await res.json();
      // Screen 3 — Lemon Squeezy's hosted, PCI-compliant card payment page
      window.location.href = checkoutUrl;
    } catch (err) {
      setError("Something went wrong starting checkout. Please try again.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Email *</label>
        <input
          type="email"
          name="email"
          required
          className="w-full border rounded px-3 py-2"
          placeholder="you@example.com"
        />
        <p className="text-xs text-gray-500 mt-1">Your download link is tied to this email.</p>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Name (optional)</label>
        <input type="text" name="name" className="w-full border rounded px-3 py-2" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Billing address (optional)</label>
        <textarea name="address" rows={2} className="w-full border rounded px-3 py-2" />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-brand-dark text-white rounded py-2.5 font-medium disabled:opacity-60"
      >
        {loading ? "Starting checkout..." : "Continue to payment"}
      </button>
    </form>
  );
}
