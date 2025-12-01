// lib/supabaseServer.ts

/**
 * Canonical server-side Supabase helpers.
 *
 * We delegate all low-level client wiring to `supabaseServerClient.ts`
 * and only add small convenience helpers here.
 */

import { createSupabaseServerClient } from "./supabaseServerClient";

export { createSupabaseServerClient };

/**
 * Fetch the current authenticated user on the server.
 *
 * Used by /app/ats/layout.tsx to protect the ATS workspace.
 * Returns `null` if there is no valid session.
 */
export async function getServerUser() {
  const supabase = createSupabaseServerClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    // Treat auth errors as "no user" instead of blowing up the layout.
    console.error("Error getting server user", error);
    return null;
  }

  return user;
}
