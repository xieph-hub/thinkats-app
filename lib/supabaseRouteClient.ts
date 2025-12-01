// lib/supabaseRouteClient.ts
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

export function createSupabaseRouteClient(req: NextRequest) {
  // We use this response so Supabase can attach Set-Cookie headers to it.
  const res = NextResponse.next({ request: req });

  const supabase: SupabaseClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          res.cookies.set({ name, value, ...(options ?? {}) });
        },
        remove(name: string, options: any) {
          res.cookies.set({
            name,
            value: "",
            ...(options ?? {}),
            maxAge: 0,
          });
        },
      },
    }
  );

  return { supabase, res };
}
