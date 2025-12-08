// lib/host.ts
import { headers } from "next/headers";

const RESERVED_SUBDOMAINS = ["www", "ats", "admin"];

function getBaseHostFromEnv(): string {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  try {
    const url = new URL(siteUrl);
    // url.host includes hostname + optional port, e.g. "localhost:3000" or "www.thinkats.com"
    return url.host;
  } catch {
    return "localhost:3000";
  }
}

/**
 * Returns:
 * - host: the incoming Host header
 * - baseHost: the naked primary domain (e.g. "thinkats.com")
 * - isPrimaryHost: true for thinkats.com / www.thinkats.com
 * - tenantSlugFromHost: subdomain treated as tenant (if any)
 */
export function getHostContext() {
  const incomingHost =
    headers().get("host") || getBaseHostFromEnv();

  const configuredBaseHost = getBaseHostFromEnv(); // may be "www.thinkats.com" or "thinkats.com"
  const nakedBaseHost = configuredBaseHost.replace(/^www\./, "");

  const isPrimaryHost =
    incomingHost === nakedBaseHost ||
    incomingHost === `www.${nakedBaseHost}`;

  let tenantSlugFromHost: string | null = null;

  if (!isPrimaryHost && incomingHost.endsWith(`.${nakedBaseHost}`)) {
    const subdomain = incomingHost.slice(
      0,
      incomingHost.length - (`.${nakedBaseHost}`).length,
    );

    if (
      subdomain &&
      !RESERVED_SUBDOMAINS.includes(subdomain.toLowerCase())
    ) {
      tenantSlugFromHost = subdomain;
    }
  }

  return {
    host: incomingHost,
    baseHost: nakedBaseHost,
    isPrimaryHost,
    tenantSlugFromHost,
  };
}
