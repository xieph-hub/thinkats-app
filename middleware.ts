// middleware.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * Auth is handled in /ats/layout.tsx using getServerUser().
 * Middleware here is only for light subdomain handling where needed.
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

  // If no extra label beyond base domain, it's just thinkats.com / www.thinkats.com
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

  if (tenantSlug) {
    const { pathname } = url;

    // IMPORTANT:
    // We no longer rewrite "/" or "/careers" for tenant hosts.
    // - app/page.tsx uses getHostContext() to render a tenant-specific front page
    // - app/careers/page.tsx uses getHostContext() to render the careers microsite
    //
    // The browser URL stays:
    //   - https://tenant.thinkats.com/
    //   - https://tenant.thinkats.com/careers
    // and the app router decides what to show based on host.

    // Optional: keep the /jobs helper – just adds tenantSlug as a query param.
    if (pathname === "/jobs" || pathname === "/jobs/") {
      const rewriteUrl = url.clone();
      rewriteUrl.pathname = "/jobs";
      rewriteUrl.searchParams.set("tenantSlug", tenantSlug);
      return NextResponse.rewrite(rewriteUrl);
    }

    // Everything else on the tenant subdomain just passes through
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
