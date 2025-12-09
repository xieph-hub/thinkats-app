// app/careers/[tenantSlug]/page.tsx
import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getHostContext } from "@/lib/host";

export const dynamic = "force-dynamic";

type PageProps = {
  params: { tenantSlug: string };
};

export const metadata: Metadata = {
  title: "Careers | ThinkATS",
  description: "Explore roles powered by ThinkATS.",
};

export default async function TenantCareersPage({ params }: PageProps) {
  const slug = params.tenantSlug;
  if (!slug) {
    notFound();
  }

  const { isPrimaryHost } = getHostContext();

  // On primary host, push users to the correct tenant subdomain
  if (isPrimaryHost) {
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ?? "https://thinkats.com";
    const baseDomain = new URL(siteUrl).hostname; // e.g. "thinkats.com"
    const targetUrl = `https://${slug}.${baseDomain}/careers`;
    redirect(targetUrl);
  }

  // On a tenant host, middleware should normally map /careers → /careers (host-aware).
  // This file is just a safety net if it’s hit directly.
  const tenant = await prisma.tenant.findUnique({
    where: { slug },
  });

  if (!tenant) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md rounded-xl border bg-white p-6 shadow-sm">
          <h1 className="mb-2 text-xl font-semibold text-slate-900">
            Workspace not available
          </h1>
          <p className="mb-4 text-sm text-slate-600">
            This careers site is not correctly configured. Please contact{" "}
            <a
              href="mailto:support@thinkats.com"
              className="font-medium underline"
            >
              ThinkATS support
            </a>{" "}
            for assistance.
          </p>
          <p className="text-xs text-slate-500">
            Tenant slug: <span className="font-mono">{slug}</span>
          </p>
        </div>
      </main>
    );
  }

  // If we somehow land here on a tenant host with a valid tenant, just redirect to root /careers
  redirect("/careers");
}
