// lib/supabaseServer.ts
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

export function createSupabaseServerClient(): SupabaseClient {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // For server components/layouts we only *read* cookies
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        // No-ops so Supabase doesn't explode if it tries to write
        set() {},
        remove() {},
      },
    }
  );
}

/**
 * Convenience helper: get the current authenticated user on the server.
 * Returns `null` if not signed in.
 */
export async function getServerUser() {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    console.error("Supabase getUser error:", error.message);
    return null;
  }

  return data.user ?? null;
}
