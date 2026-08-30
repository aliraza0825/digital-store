import { randomBytes, timingSafeEqual, createHmac } from "crypto";

export function generateSecureToken() {
  return randomBytes(24).toString("hex"); // 48-char one-time download token
}

export function generateOrderRef() {
  return randomBytes(16).toString("hex");
}

// Verifies Lemon Squeezy's X-Signature header (HMAC-SHA256 of the raw request body).
export function verifyLemonSqueezySignature(rawBody: string, signatureHeader: string | null) {
  if (!signatureHeader) return false;
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET!;
  const digest = createHmac("sha256", secret).update(rawBody).digest("hex");
  const digestBuf = Buffer.from(digest, "utf8");
  const sigBuf = Buffer.from(signatureHeader, "utf8");
  if (digestBuf.length !== sigBuf.length) return false;
  return timingSafeEqual(digestBuf, sigBuf);
}

// Simple signed cookie value for the admin session (no external session store needed).
export function adminCookieValue() {
  const secret = process.env.ADMIN_COOKIE_SECRET!;
  return createHmac("sha256", secret).update("admin-session").digest("hex");
}
