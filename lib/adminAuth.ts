import { cookies } from "next/headers";
import { adminCookieValue } from "@/lib/token";

export function isAdminAuthed() {
  const cookie = cookies().get("admin_session")?.value;
  return !!cookie && cookie === adminCookieValue();
}
