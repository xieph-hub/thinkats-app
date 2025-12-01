// lib/supabaseRouteClient.ts
import { NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

/**
 * Shared helper for middleware / route handlers that need
 * a Supabase client wired to the request/response cookies.
 *
 * Usage:
 *   const { supabase, res } = createSupabaseRouteClient(req);
 *   const { data: { session } } = await supabase.auth.getSession();
 *   // ...then return `res` (possibly modified) from middleware/route.
 */
export function createSupabaseRouteClient(req: NextRequest) {
  // We start with a "next" response so Supabase can mutate cookies on it.
  const res = NextResponse.next({ request: req });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          res.cookies.set(name, value, options);
        },
        remove(name: string, options: CookieOptions) {
          res.cookies.delete(name, options);
        },
      },
    }
  );

  return { supabase, res };
}
