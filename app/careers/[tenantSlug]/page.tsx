// app/careers/[tenantSlug]/page.tsx
import { redirect } from "next/navigation";

type TenantCareersRedirectProps = {
  params: { tenantSlug: string };
};

function getBaseDomain(): string {
  // Optional: you can set NEXT_PUBLIC_BASE_DOMAIN="thinkats.com"
  // to avoid parsing the URL.
  const explicit = process.env.NEXT_PUBLIC_BASE_DOMAIN;
  if (explicit) {
    return explicit.replace(/^www\./, "");
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://thinkats.com";
  try {
    const url = new URL(siteUrl);
    return url.hostname.replace(/^www\./, "");
  } catch {
    return "thinkats.com";
  }
}

export default function TenantCareersRedirect({
  params,
}: TenantCareersRedirectProps) {
  const baseDomain = getBaseDomain();
  const slug = decodeURIComponent(params.tenantSlug);

  // e.g. https://thinkats.com/careers/resourcin
  //  → https://resourcin.thinkats.com/careers
  redirect(`https://${slug}.${baseDomain}/careers`);
}
