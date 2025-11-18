// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const host = req.headers.get('host') || '';

  // Example hosts:
  // app.resourcin.com          -> ThinkATS app
  // resourcin.com              -> marketing site
  // clientslug.resourcin.com   -> careers

  // 1) If host starts with "app.", we’re in ATS mode
  if (host.startsWith('app.')) {
    // We can optionally redirect / to /ats
    if (url.pathname === '/') {
      url.pathname = '/ats';
      return NextResponse.redirect(url);
    }
    // Otherwise just continue; ATS pages will run
    return NextResponse.next();
  }

  // 2) If host ends with ".resourcin.com" but not "app.", treat the subdomain as tenant slug
  const rootDomain = 'resourcin.com';
  if (host.endsWith('.' + rootDomain) && !host.startsWith('app.')) {
    const subdomain = host.replace('.' + rootDomain, '');

    // Inject tenant slug into headers (or cookies) for server components
    const res = NextResponse.next();
    res.headers.set('x-tenant-slug', subdomain);
    return res;
  }

  // 3) Default (root domain) just continues (marketing site)
  return NextResponse.next();
}

// Limit middleware to paths we care about if needed
export const config = {
  matcher: ['/ats/:path*', '/careers/:path*', '/'],
};
