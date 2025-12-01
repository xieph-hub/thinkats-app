// lib/supabaseRouteClient.ts
import { NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { Database } from "@/types/supabase";

/**
 * Helper for middleware / route handlers that need a Supabase server client
 * wired to Next.js cookies.
 *
 * Usage in middleware:
 *   const { supabase, res } = createSupabaseRouteClient(req);
 *   const { data: { session } } = await supabase.auth.getSession();
 *   // ...redirect logic...
 *   return res;
 */
export function createSupabaseRouteClient(req: NextRequest) {
  // Create a response we can mutate cookies on
  const res = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // Write / update auth cookies on the response
          res.cookies.set(name, value, {
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          // "Delete" by setting an expired cookie – this matches Supabase docs
          res.cookies.set(name, "", {
            ...options,
            maxAge: 0,
          });
        },
      },
    }
  );

  return { supabase, res };
}
