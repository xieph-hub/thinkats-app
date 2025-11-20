// lib/supabaseAdmin.ts

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Fail fast on the server if env vars are missing
if (!SUPABASE_URL) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL environment variable for Supabase admin client."
  );
}

if (!SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(
    "Missing SUPABASE_SERVICE_ROLE_KEY environment variable for Supabase admin client."
  );
}

/**
 * supabaseAdmin
 *
 * - Uses the service role key.
 * - Server-side only (API routes, server actions).
 * - Bypasses RLS, so NEVER expose this to the browser.
 */
export const supabaseAdmin = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Support both:
//   import supabaseAdmin from "@/lib/supabaseAdmin";
// and
//   import { supabaseAdmin } from "@/lib/supabaseAdmin";
export default supabaseAdmin;
