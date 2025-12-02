// lib/supabaseServer.ts
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";

/**
 * Server-side Supabase client for layouts / server components.
 * IMPORTANT: we only READ cookies here – no mutation – to avoid
 * "Cookies can only be modified..." errors in App Router.
 */
export function createSupabaseServerClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        // No-ops in server components / layouts
        set() {},
        remove() {},
      },
    }
  );
}

/**
 * Helper to get the current user on the server.
 */
export async function getServerUser(): Promise<User | null> {
  const supabase = createSupabaseServerClient();

  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      console.error("Supabase auth.getUser error in getServerUser:", error);
      return null;
    }

    return data.user ?? null;
  } catch (err) {
    console.error("Unexpected Supabase error in getServerUser:", err);
    return null;
  }
}
