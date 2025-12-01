// lib/supabaseRouteClient.ts
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/types/supabase";

/**
 * Shared helper for middleware / route handlers that need
 * a Supabase client wired to the request/response cookies.
 *
 * Usage:
 *   const { supabase, res } = createSupabaseRouteClient(req);
 *   const { data: { session } } = await supabase.auth.getSession();
 *   // ... then return `res` (possibly modified) from middleware/route.
 */
export function createSupabaseRouteClient(req: NextRequest) {
  // Keep the "next" response so we can mutate cookies on it
  const res = NextResponse.next({ request: req });

  // IMPORTANT: no explicit SupabaseClient annotation here.
  // Let TS infer from createServerClient<Database>.
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return req.cookies.get(name)?.value;
        },
        set(name, value, options) {
          res.cookies.set(name, value, options);
        },
        remove(name, options) {
          res.cookies.delete(name, options);
        },
      },
    }
  );

  return { supabase, res };
}
