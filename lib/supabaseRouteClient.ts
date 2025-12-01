// lib/supabaseRouteClient.ts
import { NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

/**
 * Shared helper for middleware / route handlers that need
 * a Supabase server client wired to Next.js cookies.
 *
 * - Works in the Edge runtime (middleware, route handlers).
 * - No custom Database type needed.
 */
export function createSupabaseRouteClient(req: NextRequest, res: NextResponse) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, // or PUBLISHABLE_KEY if that's what you use
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          res.cookies.set(name, value, options);
        },
        remove(name: string, _options: CookieOptions) {
          // Next 14 delete signature: just pass the name
          res.cookies.delete(name);
        },
      },
    }
  );

  return supabase;
}
