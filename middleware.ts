// middleware.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(req: NextRequest) {
  // Clone the request headers for Next.js to continue the chain
  const res = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

  // Standard Supabase SSR pattern for middleware:
  // keeps auth cookies in sync and refreshes sessions.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            res.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // This call ensures middleware will exchange auth codes for a session if needed.
  // We’re not doing redirects here; access control is in app/ats/layout.tsx.
  await supabase.auth.getUser();

  return res;
}

// Apply middleware to everything except static assets
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
