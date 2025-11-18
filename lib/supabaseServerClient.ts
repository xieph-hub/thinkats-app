// lib/supabaseServerClient.ts
import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

/**
 * Server-side Supabase client using the ANON key.
 * Safe for server components, RLS-protected queries, and route handlers.
 */
export function createSupabaseServerClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,       // your Supabase URL
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, // your anon key
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options as CookieOptions);
            });
          } catch {
            // In some server contexts (e.g. during static generation),
            // cookies are read-only. It's safe to ignore.
          }
        },
      },
    }
  );
}
