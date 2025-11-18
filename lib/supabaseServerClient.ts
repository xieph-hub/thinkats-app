// lib/supabaseServerClient.ts
import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

/**
 * Server-side Supabase client using the ANON key.
 * Safe for server components and RLS-protected queries.
 */
export function createSupabaseServerClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,       // ✅ matches your env var
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, // ✅ matches your env var
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
            // In some server contexts cookies are read-only.
            // It's okay to ignore errors here.
          }
        },
      },
    }
  );
}
