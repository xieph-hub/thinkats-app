// lib/host.ts
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

function getBaseDomain() {
  // If you later want to be super explicit, set:
  // NEXT_PUBLIC_APP_DOMAIN=thinkats.com
  const explicit = process.env.NEXT_PUBLIC_APP_DOMAIN;
  if (explicit) {
    return explicit.replace(/^https?:\/\//, "").replace(/^www\./, "");
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL;
  if (siteUrl) {
    try {
      const url = new URL(siteUrl);
      return url.host.replace(/^www\./, "");
    } catch {
      // If it's not a full URL, fall back to simple cleanup
      return siteUrl.replace(/^https?:\/\//, "").replace(/^www\./, "");
    }
  }

  // Last-resort fallback
  return "thinkats.com";
}

export type HostContext = {
  host: string;
  baseDomain: string;
  subdomain: string | null;
  isAppHost: boolean;
  // Kept for backwards-compatibility; treat as "is careersite host"
  isTenantHost: boolean;
  // New explicit flag
  isCareersiteHost: boolean;
  // Workspace behind this host
  tenant: any | null;
  // End-client company (if this is a client careersite)
  clientCompany: any | null;
  // Tenant-level careersite settings
  careerSiteSettings: any | null;
};

export async function getHostContext(): Promise<HostContext> {
  const hdrs = headers();
  const rawHost = hdrs.get("host") || "";
  const host = rawHost.toLowerCase();

  const baseDomain = getBaseDomain();
  const isLocalhost =
    host.includes("localhost") || host.startsWith("127.0.0.1");

  if (isLocalhost) {
    // Local dev or preview: treat as app host
    return {
      host,
      baseDomain,
      subdomain: null,
      isAppHost: true,
      isTenantHost: false,
      isCareersiteHost: false,
      tenant: null,
      clientCompany: null,
      careerSiteSettings: null,
    };
  }

  const isAppHost = host === baseDomain || host === `www.${baseDomain}`;

  let subdomain: string | null = null;
  if (!isAppHost && host.endsWith(`.${baseDomain}`)) {
    subdomain = host.replace(`.${baseDomain}`, "");
  }

  let tenant: any | null = null;
  let clientCompany: any | null = null;
  let careerSiteSettings: any | null = null;

  // ---------------------------------------------------------------------------
  // 1) If this is a subdomain of thinkats.com, first try as a CLIENT careersite
  //    e.g. acme.thinkats.com → ClientCompany.careersiteSlug = "acme"
  // ---------------------------------------------------------------------------
  if (subdomain) {
    clientCompany = await prisma.clientCompany.findFirst({
      where: {
        careersiteEnabled: true,
        careersiteSlug: subdomain,
      },
      include: {
        tenant: true,
      },
    });

    if (clientCompany) {
      tenant = clientCompany.tenant;
      careerSiteSettings = await prisma.careerSiteSettings.findFirst({
        where: { tenantId: tenant.id },
      });
    }
  }

  // ---------------------------------------------------------------------------
  // 2) If no clientCompany match but we DO have a subdomain, treat as TENANT
  //    e.g. resourcin.thinkats.com → Tenant.slug = "resourcin"
  // ---------------------------------------------------------------------------
  if (!clientCompany && subdomain) {
    tenant = await prisma.tenant.findUnique({
      where: { slug: subdomain },
    });

    if (tenant) {
      careerSiteSettings = await prisma.careerSiteSettings.findFirst({
        where: { tenantId: tenant.id },
      });
    }
  }

  // ---------------------------------------------------------------------------
  // 3) If it's not the app host AND not a subdomain of thinkats.com,
  //    it might be a CUSTOM client careersite domain:
  //    e.g. jobs.acme.com → ClientCompany.careersiteCustomDomain = "jobs.acme.com"
  // ---------------------------------------------------------------------------
  if (!isAppHost && !subdomain && !clientCompany) {
    clientCompany = await prisma.clientCompany.findFirst({
      where: {
        careersiteEnabled: true,
        careersiteCustomDomain: host,
      },
      include: {
        tenant: true,
      },
    });

    if (clientCompany) {
      tenant = clientCompany.tenant;
      careerSiteSettings = await prisma.careerSiteSettings.findFirst({
        where: { tenantId: tenant.id },
      });
    }
  }

  const isCareersiteHost = !!clientCompany || (!!tenant && !isAppHost);
  const isTenantHost = isCareersiteHost; // alias

  return {
    host,
    baseDomain,
    subdomain,
    isAppHost,
    isTenantHost,
    isCareersiteHost,
    tenant,
    clientCompany,
    careerSiteSettings,
  };
}
