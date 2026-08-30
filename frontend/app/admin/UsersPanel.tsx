"use client";

import { useState } from "react";
import type { AdminUser } from "@/lib/api";

export default function UsersPanel({ users }: { users: AdminUser[] }) {
  const [list, setList] = useState(users);
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState<"admin" | "customer">("customer");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const res = await fetch("/api/admin/users", { credentials: "include" });
    if (res.ok) setList(await res.json());
  }

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setError(null);
    const res = await fetch("/api/admin/users", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, firstName, lastName, role, password: password || null }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.detail || "Could not create user");
      return;
    }
    setEmail("");
    setFirstName("");
    setLastName("");
    setPassword("");
    setRole("customer");
    setMessage("User created.");
    await refresh();
  }

  async function updateRole(id: string, nextRole: "admin" | "customer") {
    setError(null);
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: nextRole }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.detail || "Could not update role");
      return;
    }
    await refresh();
  }

  async function removeUser(id: string) {
    if (!confirm("Delete this user?")) return;
    setError(null);
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.detail || "Could not delete user");
      return;
    }
    await refresh();
  }

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <form onSubmit={createUser} className="bg-white border rounded-lg p-5 space-y-3">
        <h2 className="font-medium">Add user</h2>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          required
          placeholder="Email *"
          className="w-full border rounded px-3 py-2"
        />
        <div className="grid grid-cols-2 gap-3">
          <input
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="First name"
            className="w-full border rounded px-3 py-2"
          />
          <input
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Last name"
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as "admin" | "customer")}
          className="w-full border rounded px-3 py-2"
        >
          <option value="customer">Customer</option>
          <option value="admin">Admin</option>
        </select>
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          placeholder={role === "admin" ? "Password * (required for admin)" : "Password (optional)"}
          required={role === "admin"}
          className="w-full border rounded px-3 py-2"
        />
        {message && <p className="text-sm text-green-600">{message}</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" className="w-full bg-brand-dark text-white rounded py-2.5 font-medium">
          Create user
        </button>
      </form>

      <div className="bg-white border rounded-lg divide-y">
        {list.length === 0 && <p className="p-4 text-sm text-gray-500">No users yet.</p>}
        {list.map((u) => (
          <div key={u.id} className="p-4 flex items-start justify-between gap-3 text-sm">
            <div>
              <p className="font-medium">{u.fullName || u.email}</p>
              <p className="text-gray-500">{u.email}</p>
              <p className="text-xs mt-1 uppercase tracking-wide text-gray-400">{u.role}</p>
            </div>
            <div className="flex flex-col gap-2 items-end">
              <select
                value={u.role}
                onChange={(e) => updateRole(u.id, e.target.value as "admin" | "customer")}
                className="border rounded px-2 py-1 text-xs"
              >
                <option value="customer">Customer</option>
                <option value="admin">Admin</option>
              </select>
              <button
                type="button"
                onClick={() => removeUser(u.id)}
                className="text-xs text-red-600 hover:underline"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
