// lib/tenantHost.ts
import { headers } from "next/headers";

/**
 * Base apex domain for this deployment, used to construct tenant subdomains.
 * Derives from NEXT_PUBLIC_SITE_URL so it works across environments.
 *
 * e.g. NEXT_PUBLIC_SITE_URL = "https://thinkats.com"
 *  -> baseDomain = "thinkats.com"
 */
export function getBaseDomain(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL ?? "https://thinkats.com";

  try {
    const { hostname } = new URL(raw);
    // Strip leading "www."
    return hostname.replace(/^www\./i, "");
  } catch {
    // Safe fallback for prod
    return "thinkats.com";
  }
}

/**
 * Reads the Host header and returns:
 * - the host (without port)
 * - the baseDomain (from NEXT_PUBLIC_SITE_URL)
 * - whether we're on the primary host
 * - the tenantSlug implied by the subdomain, if any
 *
 * Examples:
 *   host: "thinkats.com"          -> isPrimaryHost = true, tenantSlugFromHost = null
 *   host: "www.thinkats.com"      -> isPrimaryHost = true, tenantSlugFromHost = null
 *   host: "resourcin.thinkats.com"-> isPrimaryHost = false, tenantSlugFromHost = "resourcin"
 */
export function getHostContext() {
  const baseDomain = getBaseDomain();

  const h = headers();
  const hostHeader = (h.get("host") || "").toLowerCase();
  const hostWithoutPort = hostHeader.split(":")[0];

  const primaryApex = baseDomain.toLowerCase();
  const primaryWww = `www.${primaryApex}`;

  const isPrimaryHost =
    hostWithoutPort === primaryApex || hostWithoutPort === primaryWww;

  let tenantSlugFromHost: string | null = null;

  if (!isPrimaryHost && hostWithoutPort.endsWith(primaryApex)) {
    const parts = hostWithoutPort.split(".");
    const baseParts = primaryApex.split(".");

    // e.g. "resourcin.thinkats.com" -> ["resourcin","thinkats","com"]
    if (parts.length > baseParts.length) {
      const maybeSub = parts[0];
      if (maybeSub && maybeSub !== "www") {
        tenantSlugFromHost = maybeSub;
      }
    }
  }

  return {
    host: hostWithoutPort,
    baseDomain: primaryApex,
    isPrimaryHost,
    tenantSlugFromHost,
  };
}
