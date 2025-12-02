// middleware.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * We no longer run Supabase auth in middleware.
 * Auth protection is handled in /ats/layout.tsx using getServerUser().
 */
export function middleware(_req: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/ats/:path*"],
};
