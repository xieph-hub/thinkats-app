// lib/supabaseServerClient.ts
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
        // server components/layouts only *read* cookies
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        // no-ops – we don't write cookies from layouts/pages,
        // that happens in API routes / middleware instead
        set() {},
        remove() {},
      },
    }
  );
}

/**
 * Simple helper used by layouts to check auth.
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
