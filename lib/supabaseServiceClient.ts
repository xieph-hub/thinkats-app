// lib/supabaseServiceClient.ts
import { createClient } from "@supabase/supabase-js";

/**
 * Service-role client: bypasses RLS.
 * Only use this in server-side code (API routes, cron jobs etc).
 * Never import this in client components.
 */
export const supabaseService = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,    // ✅ your URL
  process.env.SUPABASE_SERVICE_ROLE_KEY!    // ✅ your service role key
);
