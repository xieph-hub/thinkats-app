// lib/supabaseServerClient.ts
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function createSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Supabase env vars NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set"
    );
  }

  // Next.js app router cookie store
  const cookieStore = cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      // Read all cookies for Supabase
      getAll() {
        return cookieStore.getAll();
      },
      // Write cookies (auth tokens) – safe in route handlers / middleware.
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // When called from a Server Component, cookies() is read-only.
          // We can safely ignore in that context.
        }
      },
    },
  });
}
