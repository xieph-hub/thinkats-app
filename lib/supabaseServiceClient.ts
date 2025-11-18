// lib/supabaseServiceClient.ts
import { createClient } from "@supabase/supabase-js";

export const supabaseService = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,     // ✅ same URL
  process.env.SUPABASE_SERVICE_ROLE_KEY!     // ✅ your service role key (no NEXT_PUBLIC)
);
