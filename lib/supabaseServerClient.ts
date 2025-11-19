// lib/supabaseServerClient.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Server-side Supabase client for use in Server Components / server utilities.
 *
 * - Uses the official getAll/setAll pattern for cookies (no get/set/remove).
 * - Safe to call from Server Components (setAll is wrapped in try/catch).
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      'Supabase env vars NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY are not set'
    );
  }

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        // In Server Components, writes can throw – Supabase docs recommend
        // catching and ignoring, as long as middleware or route handlers
        // refresh sessions.
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Called from a context where cookies can't be written (e.g. RSC).
          // It's safe to ignore; auth still works based on existing cookies.
        }
      },
    },
  });
}
