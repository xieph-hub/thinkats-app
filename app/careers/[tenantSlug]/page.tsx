// app/careers/[tenantSlug]/page.tsx
import { redirect, notFound } from "next/navigation";
import { getHostContext } from "@/lib/host";

type PageProps = {
  params: { tenantSlug: string };
};

export default function CareersTenantSlugRedirect({ params }: PageProps) {
  const { isPrimaryHost } = getHostContext();
  const slug = params.tenantSlug;

  if (!slug) {
    notFound();
  }

  // If we're already on a tenant subdomain (e.g. resourcin.thinkats.com),
  // never bounce between /careers and /careers/[slug]. Just send to /careers.
  if (!isPrimaryHost) {
    redirect("/careers");
  }

  // On the primary host, redirect to the tenant's subdomain careers page.
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://thinkats.com";
  const baseDomain = new URL(siteUrl).hostname; // e.g. "thinkats.com"

  const targetUrl = `https://${slug}.${baseDomain}/careers`;
  redirect(targetUrl);
}
