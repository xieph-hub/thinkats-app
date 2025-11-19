// lib/supabaseServerClient.ts
import { cookies } from "next/headers";
import {
  createServerClient,
  type CookieOptions,
} from "@supabase/ssr";

export function createSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Supabase env vars NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set"
    );
  }

  return createServerClient(url, anonKey, {
    cookies: {
      get(name: string) {
        return cookies().get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        cookies().set(name, value, options);
      },
      remove(name: string, options: CookieOptions) {
        cookies().set(name, "", options);
      },
    },
  });
}
