// lib/supabaseAdmin.ts
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.warn(
    "Supabase admin client: missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
  );
}

/**
 * Single shared admin client instance.
 * Can be imported as:
 *   import supabaseAdmin from "@/lib/supabaseAdmin"
 * or
 *   import { supabaseAdmin } from "@/lib/supabaseAdmin"
 */
const supabaseAdmin = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    })
  // Fallback; will throw if you try to use it without proper env vars.
  : (null as any);

/**
 * Helper for code that wants an explicit factory-style function.
 * Used by the new public apply API.
 */
export function createSupabaseAdminClient() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Supabase admin env vars are not set.");
  }
  if (!supabaseAdmin) {
    throw new Error("Supabase admin client is not initialised.");
  }
  return supabaseAdmin;
}

// Named export for legacy imports: { supabaseAdmin }
export { supabaseAdmin };

// Default export for legacy imports: import supabaseAdmin from ...
export default supabaseAdmin;
