import { createClient } from "@supabase/supabase-js";

// Public client: safe to use in Server Components for read-only product listing.
// Relies on the RLS policy that only exposes active products.
export const supabasePublic = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Admin/server client: full access, bypasses RLS. ONLY import this in server-side
// code (API routes / server actions) — never in a file that ships to the browser.
export function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
