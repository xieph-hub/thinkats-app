// lib/supabaseServer.ts

/**
 * Thin compatibility wrapper so anything that imports
 * "./supabaseServer" still works.
 *
 * The actual implementation lives in supabaseServerClient.ts,
 * which already wires Supabase to Next.js cookies correctly.
 */
export { createSupabaseServerClient } from "./supabaseServerClient";
