// lib/supabaseServer.ts

// We reuse the route client (cookies-based) for server-side usage as well.
import { createSupabaseRouteClient } from "./supabaseRouteClient";
import { getServerUser as internalGetServerUser } from "./auth/getServerUser";

/**
 * Backwards-compatible Supabase "server" client.
 *
 * Older code (e.g. lib/candidates.ts) expects this function to exist.
 * For now we just delegate to the route handler client, which is
 * perfectly fine for server components / server utilities that run
 * with access to Next.js cookies.
 */
export function createSupabaseServerClient() {
  return createSupabaseRouteClient();
}

/**
 * Backwards-compatible re-export of the new getServerUser helper.
 *
 * Newer code can import from "@/lib/auth/getServerUser" directly,
 * while older code that still imports from "@/lib/supabaseServer"
 * will keep working.
 */
export async function getServerUser() {
  return internalGetServerUser();
}

// Optional: if anything elsewhere imports this symbol from here.
export { createSupabaseRouteClient };
