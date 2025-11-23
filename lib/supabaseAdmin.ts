// lib/supabaseAdmin.ts
//
// Admin Supabase client for server-side code only.
// Uses the SERVICE ROLE key (bypasses RLS) so:
//
// - DO NOT import this in "use client" components.
// - Only use in API routes, server components, and server utilities.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
}

if (!SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
}

// Main admin client (named export)
export const supabaseAdmin: SupabaseClient = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

// Legacy helper for any code that expected a function
// like `createSupabaseAdminClient()`.
export function createSupabaseAdminClient(): SupabaseClient {
  return supabaseAdmin;
}

// Default export for any older imports like:
//   import supabaseAdmin from "@/lib/supabaseAdmin";
export default supabaseAdmin;
