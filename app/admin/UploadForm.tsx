"use client";

import { useState } from "react";

export default function UploadForm() {
  const [status, setStatus] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("saving");
    setMessage(null);

    const form = e.currentTarget;
    const formData = new FormData(form);

    const res = await fetch("/api/admin/products", { method: "POST", body: formData });

    if (res.ok) {
      setStatus("done");
      setMessage("Product added.");
      form.reset();
      // Simple refresh so the "Products" list on the right picks up the new item.
      setTimeout(() => window.location.reload(), 800);
    } else {
      const body = await res.json().catch(() => ({}));
      setStatus("error");
      setMessage(body.error || "Something went wrong.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border rounded-lg p-5 space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Title *</label>
        <input name="title" required className="w-full border rounded px-3 py-2" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <textarea name="description" rows={2} className="w-full border rounded px-3 py-2" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Price (USD) *</label>
        <input
          name="price"
          type="number"
          step="0.01"
          min="0.01"
          required
          className="w-full border rounded px-3 py-2"
          placeholder="5.00"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">
          Lemon Squeezy Variant ID *
        </label>
        <input name="variantId" required className="w-full border rounded px-3 py-2" />
        <p className="text-xs text-gray-500 mt-1">
          Create a matching product in your Lemon Squeezy dashboard first, then paste its
          Variant ID here so this listing is linked to the right checkout.
        </p>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Thumbnail image *</label>
        <input name="thumbnail" type="file" accept="image/*" required className="w-full text-sm" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Product file *</label>
        <input name="file" type="file" required className="w-full text-sm" />
        <p className="text-xs text-gray-500 mt-1">The actual PDF / Canva export buyers receive.</p>
      </div>
      {message && (
        <p className={`text-sm ${status === "error" ? "text-red-600" : "text-green-600"}`}>
          {message}
        </p>
      )}
      <button
        type="submit"
        disabled={status === "saving"}
        className="w-full bg-brand-dark text-white rounded py-2.5 font-medium disabled:opacity-60"
      >
        {status === "saving" ? "Uploading..." : "Add product"}
      </button>
    </form>
  );
}
