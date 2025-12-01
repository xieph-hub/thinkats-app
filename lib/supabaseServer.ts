// lib/supabaseServer.ts
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-side Supabase client that reads auth from cookies.
 * Use ONLY in server components, layouts and server actions.
 */
export function getSupabaseServerClient(): SupabaseClient {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // On the server we only *read* cookies here
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        // No-ops so we don't try to write cookies from server components
        set() {},
        remove() {},
      },
    }
  );
}

/**
 * Convenience helper: "Who is the logged-in user on this request?"
 */
export async function getServerUser() {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    console.error("Supabase getUser error:", error.message);
    return null;
  }

  return data.user ?? null;
}
