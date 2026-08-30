import { sessionCookieHeader } from "@/lib/adminAuth";
import {
  fetchAdminCarts,
  fetchAdminMe,
  fetchAdminOrders,
  fetchAdminProducts,
  fetchAdminUsers,
} from "@/lib/api";
import AdminDashboard from "./AdminDashboard";
import AdminLogin from "./AdminLogin";

export const revalidate = 0;

export default async function AdminPage() {
  const cookieHeader = sessionCookieHeader();
  const me = await fetchAdminMe(cookieHeader);

  if (!me || me.role !== "admin") {
    return <AdminLogin />;
  }

  const [products, users, carts, orders] = await Promise.all([
    fetchAdminProducts(cookieHeader),
    fetchAdminUsers(cookieHeader),
    fetchAdminCarts(cookieHeader),
    fetchAdminOrders(cookieHeader),
  ]);

  return (
    <AdminDashboard
      me={me}
      products={products}
      users={users}
      carts={carts}
      orders={orders}
    />
  );
}
