// lib/supabaseRouteClient.ts
import { NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Helper for route handlers (app/api/*) that need Supabase auth
 * and need to keep cookies in sync.
 *
 * Usage:
 *   const { supabase, res } = createSupabaseRouteClient(request);
 */
type SupabaseRouteClient = {
  supabase: SupabaseClient;
  res: NextResponse;
};

export function createSupabaseRouteClient(
  request: NextRequest
): SupabaseRouteClient {
  const res = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // Next 14 + Supabase recommended pattern: pass an object
          res.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          // Clear cookie by setting empty value
          res.cookies.set({
            name,
            value: "",
            ...options,
          });
        },
      },
    }
  );

  return { supabase, res };
}
