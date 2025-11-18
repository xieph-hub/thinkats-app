// lib/supabaseServerClient.ts
import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

export function createSupabaseServerClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,          // ✅ your URL
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,    // ✅ your anon key
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
            // In some server component contexts cookies are read-only.
            // It's safe to ignore here if you're not rotating sessions in this code.
          }
        },
      },
    }
  );
}
