// lib/host.ts
"use server";

import { headers } from "next/headers";

export type HostContext = {
  host: string;                  // raw host (without port)
  hostname: string;              // same as host, lowercased
  baseDomain: string;            // e.g. "thinkats.com"
  isPrimaryHost: boolean;        // true for thinkats.com / www.thinkats.com / localhost
  tenantSlugFromHost: string | null; // e.g. "resourcin" from resourcin.thinkats.com
};

/**
 * Derive tenant context from the incoming Host header.
 *
 * Works for:
 *  - thinkats.com / www.thinkats.com          → primary host
 *  - resourcin.thinkats.com                  → tenant subdomain "resourcin"
 *  - localhost:3000 (dev)                    → primary host
 */
export function getHostContext(): HostContext {
  const hdrs = headers();

  // Prefer proxy header on Vercel, fall back to Host
  const rawHost =
    hdrs.get("x-forwarded-host") ??
    hdrs.get("host") ??
    "";

  const hostname = rawHost.split(":")[0].toLowerCase();
  const parts = hostname.split(".").filter(Boolean);

  // Local dev or single-label host (e.g. "localhost")
  if (parts.length <= 1) {
    return {
      host: hostname,
      hostname,
      baseDomain: hostname,
      isPrimaryHost: true,
      tenantSlugFromHost: null,
    };
  }

  // Primary domain style:
  //  - thinkats.com
  //  - www.thinkats.com
  if (
    parts.length === 2 || // thinkats.com
    (parts.length === 3 && parts[0] === "www") // www.thinkats.com
  ) {
    const baseDomain =
      parts.length === 2 ? hostname : parts.slice(1).join(".");

    return {
      host: hostname,
      hostname,
      baseDomain,
      isPrimaryHost: true,
      tenantSlugFromHost: null,
    };
  }

  // Tenant subdomain style:
  //  - resourcin.thinkats.com
  //  - acme.eu.thinkats.com (we still treat first label as tenant)
  const tenantSlugFromHost = parts[0];
  const baseDomain = parts.slice(-2).join(".");

  return {
    host: hostname,
    hostname,
    baseDomain,
    isPrimaryHost: false,
    tenantSlugFromHost,
  };
}
