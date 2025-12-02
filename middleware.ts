// middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

// Protect /ats/* and keep /login, /signup behaving correctly
export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // Mirror Supabase's recommended pattern for App Router
          res.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          // Clear cookie by setting empty value
          res.cookies.set({
            name,
            value: "",
            ...options,
          });
        },
      },
    }
  );

  const { data, error } = await supabase.auth.getUser();
  if (error) {
    console.error("Supabase auth.getUser error in middleware:", error);
  }

  const user = data?.user ?? null;
  const url = req.nextUrl;

  const isAuthPage =
    url.pathname === "/login" || url.pathname === "/signup";
  const isAtsRoute = url.pathname.startsWith("/ats");

  // 1) Hitting /ats* while NOT logged in → send to /login with callbackUrl
  if (!user && isAtsRoute) {
    const redirectUrl = new URL("/login", req.url);
    redirectUrl.searchParams.set(
      "callbackUrl",
      url.pathname + url.search
    );
    return NextResponse.redirect(redirectUrl);
  }

  // 2) Hitting /login or /signup while logged in → send to /ats (or callback)
  if (user && isAuthPage) {
    const callback = url.searchParams.get("callbackUrl");
    const destination = callback || "/ats";
    return NextResponse.redirect(new URL(destination, req.url));
  }

  // 3) All other cases → carry on, with cookies properly wired
  return res;
}

// Only run middleware where we actually need auth logic
export const config = {
  matcher: ["/ats/:path*", "/login", "/signup"],
};
