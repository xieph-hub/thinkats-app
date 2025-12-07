// middleware.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * Auth is handled in /ats/layout.tsx using getServerUser().
 * Middleware here is only for subdomain → tenant routing and light rewrites.
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://thinkats.com";

// Derive the base domain (e.g. "thinkats.com") from NEXT_PUBLIC_SITE_URL
const BASE_DOMAIN = (() => {
  try {
    return new URL(SITE_URL).hostname; // "thinkats.com"
  } catch {
    return "thinkats.com";
  }
})();

// Subdomains we DON'T want to treat as tenant slugs
const RESERVED_SUBDOMAINS = ["www", "app", "ats", "admin", "api"];

function getTenantSlugFromHostname(hostname: string): string | null {
  // Only handle hosts under the main domain (e.g. *.thinkats.com)
  if (!hostname.endsWith(BASE_DOMAIN)) return null;

  const hostParts = hostname.split(".");
  const baseParts = BASE_DOMAIN.split(".");

  // If no extra label beyond base domain, it's just thinkats.com
  if (hostParts.length <= baseParts.length) return null;

  const subdomain = hostParts[0]; // "acme" in acme.thinkats.com

  if (!subdomain || RESERVED_SUBDOMAINS.includes(subdomain.toLowerCase())) {
    return null;
  }

  return subdomain;
}

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const hostname = req.headers.get("host") ?? url.hostname;

  const tenantSlug = getTenantSlugFromHostname(hostname);

  // If this host looks like a tenant subdomain (e.g. acme.thinkats.com)...
  if (tenantSlug) {
    const { pathname } = url;

    // 1) acme.thinkats.com → /careers/acme
    if (pathname === "/" || pathname === "") {
      const rewriteUrl = url.clone();
      rewriteUrl.pathname = `/careers/${encodeURIComponent(tenantSlug)}`;
      return NextResponse.rewrite(rewriteUrl);
    }

    // 2) acme.thinkats.com/careers → /careers/acme
    if (pathname === "/careers" || pathname === "/careers/") {
      const rewriteUrl = url.clone();
      rewriteUrl.pathname = `/careers/${encodeURIComponent(tenantSlug)}`;
      return NextResponse.rewrite(rewriteUrl);
    }

    // 3) acme.thinkats.com/jobs → /jobs?tenantSlug=acme
    //    (Your /jobs page can read searchParams.tenantSlug and filter.)
    if (pathname === "/jobs" || pathname === "/jobs/") {
      const rewriteUrl = url.clone();
      rewriteUrl.pathname = "/jobs";
      rewriteUrl.searchParams.set("tenantSlug", tenantSlug);
      return NextResponse.rewrite(rewriteUrl);
    }

    // Everything else on the tenant subdomain just passes through
    // (e.g. if later you add /talent-network, etc.)
  }

  // Default: behave as normal
  return NextResponse.next();
}

// Run middleware for all app routes except static assets/images/etc.
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|assets|robots.txt|sitemap.xml).*)",
  ],
};
