// app/ats/tenants/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import CopyCareersUrlButton from "./CopyCareersUrlButton";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ThinkATS | Tenants",
  description:
    "Manage client workspaces, their careers sites and marketplace visibility.",
};

// Same helper: normalise base domain from NEXT_PUBLIC_SITE_URL
function getBaseDomainFromEnv(): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://thinkats.com";
  try {
    const host = new URL(siteUrl).hostname;
    return host.startsWith("www.") ? host.slice(4) : host;
  } catch {
    return "thinkats.com";
  }
}

export default async function AtsTenantsPage() {
  const tenants = await prisma.tenant.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
      createdAt: true,
    },
  });

  const baseDomain = getBaseDomainFromEnv();

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 lg:px-8">
      <header className="space-y-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          ATS · Workspaces
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Client workspaces
        </h1>
        <p className="text-xs text-slate-600">
          Overview of tenants configured in ThinkATS. Use these cards to jump
          into workspace and careers settings, and quickly copy their public
          careers URLs.
        </p>
      </header>

      {tenants.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-600">
          No tenants found yet. Create a first tenant and its careers
          configuration to start using ThinkATS as an agency or multi-tenant
          ATS.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {tenants.map((tenant) => {
            const { id, name, slug, status, createdAt } = tenant;

            const isActive = (status || "").toLowerCase() === "active";
            const careersUrl =
              slug != null && slug.trim().length > 0
                ? `https://${slug}.${baseDomain}/careers`
                : null;

            const created =
              createdAt instanceof Date ? createdAt : new Date(createdAt);
            const createdLabel = created.toLocaleDateString(undefined, {
              year: "numeric",
              month: "short",
              day: "2-digit",
            });

            return (
              <div
                key={id}
                className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h2 className="text-sm font-semibold text-slate-900">
                        {name || slug || "Unnamed tenant"}
                      </h2>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        Tenant ID:{" "}
                        <code className="rounded bg-slate-50 px-1 py-0.5">
                          {id}
                        </code>
                      </p>
                    </div>
                    <span
                      className={[
                        "inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-medium",
                        isActive
                          ? "bg-[#E9F7EE] text-[#306B34] border border-[#C5E7CF]"
                          : "bg-slate-50 text-slate-500 border border-slate-200",
                      ].join(" ")}
                    >
                      {isActive ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500">
                    Created {createdLabel}
                  </p>

                  <div className="mt-3 space-y-1 text-[11px]">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-500">Careers URL</span>
                      {careersUrl ? (
                        <div className="flex items-center gap-2">
                          <span className="hidden max-w-[140px] truncate text-[10px] text-slate-500 sm:inline">
                            {careersUrl}
                          </span>
                          <CopyCareersUrlButton careersUrl={careersUrl} />
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400">
                          No slug configured
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
                  <Link
                    href={`/ats/tenants/${id}/careersite`}
                    className="inline-flex items-center rounded-full bg-slate-900 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-slate-800"
                  >
                    Careers settings
                  </Link>
                  <Link
                    href={`/ats/tenants/${id}`}
                    className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-medium text-slate-700 hover:bg-slate-100"
                  >
                    Workspace overview
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
