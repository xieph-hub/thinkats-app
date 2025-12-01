// middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabaseRouteClient";

const PROTECTED_PREFIXES = ["/ats"];

export async function middleware(req: NextRequest) {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;

  // Only protect /ats and /ats/*
  const requiresAuth = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (!requiresAuth) {
    return NextResponse.next();
  }

  const res = NextResponse.next();

  // Supabase server client, wired to cookies for this request/response
  const supabase = createSupabaseRouteClient(req, res);
  const { data, error } = await supabase.auth.getUser();

  const user = data?.user;

  // If no user, bounce to login with a callbackUrl back to the original path
  if (error || !user) {
    const redirectUrl = new URL("/login", req.url);
    redirectUrl.searchParams.set(
      "callbackUrl",
      `${nextUrl.pathname}${nextUrl.search}`
    );

    return NextResponse.redirect(redirectUrl);
  }

  // User is authenticated → allow request through
  return res;
}

// Only run middleware on /ats routes
export const config = {
  matcher: ["/ats", "/ats/:path*"],
};
