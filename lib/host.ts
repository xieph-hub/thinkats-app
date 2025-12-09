// lib/host.ts
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

export type HostContext = {
  host: string;
  baseDomain: string;
  subdomain: string | null;
  isAppHost: boolean;
  isTenantHost: boolean;
  isCareersiteHost: boolean;
  tenant: any | null;
  clientCompany: any | null;
  careerSiteSettings: any | null;

  // Backwards-compatibility with older code
  isPrimaryHost: boolean;
  tenantSlugFromHost: string | null;
};

function getBaseDomain() {
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
      return siteUrl.replace(/^https?:\/\//, "").replace(/^www\./, "");
    }
  }

  return "thinkats.com";
}

export async function getHostContext(): Promise<HostContext> {
  const hdrs = headers();
  const rawHost = hdrs.get("host") || "";
  const host = rawHost.toLowerCase();

  const baseDomain = getBaseDomain();
  const isLocalhost =
    host.includes("localhost") || host.startsWith("127.0.0.1");

  if (isLocalhost) {
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

      // compat
      isPrimaryHost: true,
      tenantSlugFromHost: null,
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

  // 1) Subdomain → try as client careersite first (careersiteSlug)
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

  // 2) If still nothing and we have a subdomain, treat as tenant slug
  if (!clientCompany && subdomain && !tenant) {
    tenant = await prisma.tenant.findUnique({
      where: { slug: subdomain },
    });

    if (tenant) {
      careerSiteSettings = await prisma.careerSiteSettings.findFirst({
        where: { tenantId: tenant.id },
      });
    }
  }

  // 3) Non-thinkats host → try custom client careersite domain
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
  const isTenantHost = isCareersiteHost;

  // Backwards-compat fields
  const isPrimaryHost = isAppHost;
  const tenantSlugFromHost = subdomain;

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
    isPrimaryHost,
    tenantSlugFromHost,
  };
}
