// lib/host.ts
import { headers } from "next/headers";

export type HostContext = {
  host: string;                 // raw host with optional port
  hostname: string;             // host without port, lowercased
  baseDomain: string;           // e.g. "thinkats.com"
  isPrimaryHost: boolean;       // true for thinkats.com / www.thinkats.com
  tenantSlugFromHost: string | null; // "resourcin" for resourcin.thinkats.com
};

function getPrimaryDomain(): string {
  const env = process.env.NEXT_PUBLIC_SITE_URL;
  if (env) {
    try {
      return new URL(env).hostname.toLowerCase();
    } catch {
      // If someone set it as "thinkats.com" without protocol
      return env.replace(/^https?:\/\//, "").toLowerCase();
    }
  }
  return "thinkats.com";
}

export function getHostContext(): HostContext {
  const h = headers();

  const rawHostHeader =
    h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";

  // x-forwarded-host can be a comma-separated list – take the first
  const firstHost = rawHostHeader.split(",")[0].trim();
  const hostname = firstHost.split(":")[0].toLowerCase();

  const baseDomain = getPrimaryDomain();

  let isPrimaryHost = false;
  let tenantSlugFromHost: string | null = null;

  if (hostname === baseDomain || hostname === `www.${baseDomain}`) {
    isPrimaryHost = true;
  } else if (hostname.endsWith(`.${baseDomain}`)) {
    const sub = hostname.slice(0, -1 * (`.${baseDomain}`.length));
    tenantSlugFromHost = sub || null;
  }

  return {
    host: firstHost,
    hostname,
    baseDomain,
    isPrimaryHost,
    tenantSlugFromHost,
  };
}
