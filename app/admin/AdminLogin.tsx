"use client";

import { useState } from "react";

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      window.location.reload();
    } else {
      setError("Wrong password.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xs mx-auto bg-white border rounded-lg p-6 mt-12">
      <h1 className="font-medium mb-4">Admin login</h1>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        className="w-full border rounded px-3 py-2 mb-3"
        autoFocus
      />
      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-brand-dark text-white rounded py-2 font-medium disabled:opacity-60"
      >
        {loading ? "Checking..." : "Log in"}
      </button>
    </form>
  );
}
