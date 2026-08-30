import { cookies } from "next/headers";

export function sessionCookieHeader() {
  const cookie = cookies().get("session")?.value;
  return cookie ? `session=${cookie}` : undefined;
}
