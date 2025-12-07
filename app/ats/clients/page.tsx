// app/ats/clients/page.tsx
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getResourcinTenant } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Clients | ThinkATS",
  description: "Client workspaces managed in this ATS environment.",
};

interface ClientsPageSearchParams {
  tenantId?: string | string[];
  created?: string;
  error?: string;
  q?: string;
  industry?: string;
  careersite?: string;
}

function firstString(value?: string | string[]): string {
  if (Array.isArray(value)) return value[0] || "";
  return value || "";
}

function buildClientCareersUrl(client: any): string | null {
  if (!client?.careersiteEnabled) return null;

  const customDomain = (client.careersiteCustomDomain || "").trim();
  const slug = (client.careersiteSlug || "").trim();

  // 1) Custom domain wins
  if (customDomain) {
    const hasProtocol = /^https?:\/\//i.test(customDomain);
    return hasProtocol ? customDomain : `https://${customDomain}`;
  }

  // 2) Slug under a base URL
  if (slug) {
    const base =
      process.env.NEXT_PUBLIC_CLIENT_CAREERS_BASE ||
      process.env.NEXT_PUBLIC_CAREERS_BASE_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      "";

    if (base) {
      const trimmed = base.replace(/\/$/, "");
      if (trimmed.includes("{client}")) {
        return trimmed.replace("{client}", slug);
      }
      return `${trimmed}/${slug}`;
    }

    // 3) Fallback pattern if no env is set
    return `https://${slug}.resourcin.com`;
  }

  return null;
}

export default async function ClientsIndexPage({
  searchParams,
}: {
  searchParams?: ClientsPageSearchParams;
}) {
  const s = searchParams || {};

  // Tenant resolution
  const rawTenant = s.tenantId ?? "";
  const tenantParam =
    Array.isArray(rawTenant) && rawTenant.length > 0
      ? rawTenant[0]
      : typeof rawTenant === "string"
      ? rawTenant
      : "";

  const tenants = await prisma.tenant.findMany({
    orderBy: { name: "asc" },
  });

  let selectedTenant =
    (tenantParam &&
      tenants.find(
        (t) => t.id === tenantParam || (t as any).slug === tenantParam,
      )) || (await getResourcinTenant());

  if (!selectedTenant) {
    throw new Error("No default tenant configured.");
  }

  const selectedTenantId = selectedTenant.id;

  // Filters
  const filterQ = firstString(s.q).trim();
  const filterIndustry = firstString(s.industry).trim();
  const rawCareersite = firstString(s.careersite).trim().toLowerCase();

  const baseWhere: any = {
    tenantId: selectedTenantId,
  };

  const where: any = { ...baseWhere };
  const andConditions: any[] = [];

  if (filterQ) {
    andConditions.push({
      OR: [
        { name: { contains: filterQ, mode: "insensitive" } },
        { industry: { contains: filterQ, mode: "insensitive" } },
        { website: { contains: filterQ, mode: "insensitive" } },
        { notes: { contains: filterQ, mode: "insensitive" } },
      ],
    });
  }

  if (filterIndustry) {
    andConditions.push({
      industry: { contains: filterIndustry, mode: "insensitive" },
    });
  }

  if (rawCareersite === "enabled") {
    andConditions.push({ careersiteEnabled: true });
  } else if (rawCareersite === "disabled") {
    andConditions.push({ careersiteEnabled: false });
  }

  if (andConditions.length > 0) {
    (where as any).AND = andConditions;
  }

  const [clients, totalClients, totalJobs] = await Promise.all([
    prisma.clientCompany.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { jobs: true },
        },
      },
    }),
    prisma.clientCompany.count({ where: baseWhere }),
    prisma.job.count({ where: baseWhere }),
  ]);

  const createdFlag = s.created === "1";
  const errorMessage = s.error;

  const visibleClients = clients.length;
  const linkedJobsFromVisible = clients.reduce(
    (sum, client: any) => sum + (client._count?.jobs ?? 0),
    0,
  );
  const careersiteEnabledCount = clients.filter(
    (c: any) => c.careersiteEnabled,
  ).length;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            ATS · Clients
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-900">
            Client workspaces
          </h1>
          <p className="mt-1 text-xs text-slate-600">
            Each client represents a company you run searches for under{" "}
            <span className="font-medium text-slate-900">
              {selectedTenant.name ??
                (selectedTenant as any).slug ??
                "Resourcin"}
            </span>
            .
          </p>
        </div>

        <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center sm:gap-3">
          {/* Tenant selector */}
          <form method="GET" className="hidden items-center gap-2 sm:flex">
            <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
              <span className="text-[10px] uppercase tracking-wide text-slate-500">
                Tenant
              </span>
              <select
                name="tenantId"
                defaultValue={selectedTenantId}
                className="border-none bg-transparent text-[11px] text-slate-900 outline-none focus:ring-0"
              >
                {tenants.map((tenant) => (
                  <option key={tenant.id} value={tenant.id}>
                    {tenant.name ?? (tenant as any).slug ?? tenant.id}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="text-[11px] font-medium text-[#172965] hover:underline"
              >
                Switch
              </button>
            </div>
          </form>

          <Link
            href={`/ats/clients/new?tenantId=${encodeURIComponent(
              selectedTenantId,
            )}`}
            className="inline-flex items-center rounded-md bg-[#172965] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#12204d]"
          >
            New client
          </Link>
        </div>
      </div>

      {/* Flash messages */}
      {createdFlag && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] text-emerald-800">
          Client created.
        </div>
      )}

      {errorMessage && (
        <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] text-rose-800">
          {errorMessage}
        </div>
      )}

      {/* Filters */}
      <section className="rounded-2xl border border-slate-200 bg-white p-3 text-[11px] text-slate-700">
        <form className="flex flex-wrap items-center gap-2">
          <input type="hidden" name="tenantId" value={selectedTenantId} />

          <input
            type="text"
            name="q"
            defaultValue={filterQ}
            placeholder="Search by name, website, industry, notes…"
            className="h-8 min-w-[220px] flex-1 rounded-full border border-slate-200 bg-white px-3 text-[11px] text-slate-800"
          />

          <input
            type="text"
            name="industry"
            defaultValue={filterIndustry}
            placeholder="Industry (e.g. Fintech, BPO…)"
            className="h-8 w-[180px] rounded-full border border-slate-200 bg-white px-3 text-[11px] text-slate-800"
          />

          <select
            name="careersite"
            defaultValue={rawCareersite || ""}
            className="h-8 w-[170px] rounded-full border border-slate-200 bg-white px-3 text-[11px] text-slate-800"
          >
            <option value="">All careersites</option>
            <option value="enabled">Careersite enabled</option>
            <option value="disabled">Careersite not enabled</option>
          </select>

          <button
            type="submit"
            className="inline-flex h-8 items-center rounded-full bg-slate-900 px-4 text-[11px] font-semibold text-white hover:bg-slate-800"
          >
            Apply filters
          </button>

          <Link
            href={`/ats/clients?tenantId=${encodeURIComponent(
              selectedTenantId,
            )}`}
            className="inline-flex h-8 items-center rounded-full border border-slate-200 bg-white px-3 text-[11px] text-slate-600 hover:bg-slate-50"
          >
            Reset
          </Link>
        </form>

        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-500">
          <span>
            Showing{" "}
            <span className="font-semibold text-slate-800">
              {visibleClients}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-slate-800">
              {totalClients}
            </span>{" "}
            clients ·{" "}
            <span className="font-semibold text-slate-800">
              {linkedJobsFromVisible}
            </span>{" "}
            roles linked in this view
          </span>
          <span className="text-[10px] text-slate-500">
            Careersites enabled in view:{" "}
            <span className="font-semibold text-emerald-700">
              {careersiteEnabledCount}
            </span>{" "}
            · Total roles under tenant:{" "}
            <span className="font-semibold text-slate-800">
              {totalJobs}
            </span>
          </span>
        </div>
      </section>

      {/* Empty state */}
      {clients.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
          <p>No clients match your current filters.</p>
          <p className="mt-1 text-[11px]">
            Reset filters or add a new client to start attaching roles.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {clients.map((client: any) => {
            const jobsCount = client._count?.jobs ?? 0;
            const createdLabel = new Date(
              client.createdAt,
            ).toLocaleDateString(undefined, {
              year: "numeric",
              month: "short",
              day: "2-digit",
            });

            const careersUrl = buildClientCareersUrl(client);

            return (
              <article
                key={client.id}
                className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 text-xs text-slate-700 shadow-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-start gap-3">
                  {/* Logo / avatar */}
                  <div className="mt-0.5 h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200">
                    {client.logoUrl ? (
                      <Image
                        src={client.logoUrl}
                        alt={client.name}
                        width={40}
                        height={40}
                        className="h-full w-full object-contain p-1"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[13px] font-semibold text-slate-500">
                        {client.name?.charAt(0)?.toUpperCase() ?? "C"}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <h2 className="truncate text-sm font-semibold text-slate-900">
                      {client.name}
                    </h2>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      {client.industry && (
                        <>
                          <span>{client.industry}</span>
                          <span className="mx-1 text-slate-300">•</span>
                        </>
                      )}
                      {client.website ? (
                        <a
                          href={client.website}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#172965] hover:underline"
                        >
                          {client.website.replace(/^https?:\/\//, "")}
                        </a>
                      ) : (
                        "Website not set"
                      )}
                    </p>
                    {client.notes && (
                      <p className="mt-1 line-clamp-2 text-[11px] text-slate-600">
                        {client.notes}
                      </p>
                    )}
                    <p className="mt-1 text-[11px] text-slate-400">
                      Added {createdLabel}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2 sm:items-end">
                  <div className="flex flex-wrap justify-end gap-2 text-[11px] text-slate-500">
                    <span>
                      {jobsCount}{" "}
                      {jobsCount === 1 ? "linked role" : "linked roles"}
                    </span>
                    {client.careersiteEnabled && (
                      <span className="inline-flex items-center rounded-full bg-[#64C247]/10 px-2 py-0.5 text-[10px] font-medium text-[#306B34]">
                        Careersite enabled
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap justify-end gap-2">
                    <Link
                      href={`/ats/jobs?clientId=${encodeURIComponent(
                        client.id,
                      )}`}
                      className="inline-flex items-center rounded-md border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-medium text-slate-700 hover:border-[#172965] hover:text-[#172965]"
                    >
                      View roles
                    </Link>
                    <Link
                      href={`/ats/clients/${client.id}/edit`}
                      className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-medium text-slate-700 hover:border-[#172965] hover:bg-white hover:text-[#172965]"
                    >
                      Edit
                    </Link>
                    {careersUrl && (
                      <a
                        href={careersUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center rounded-md bg-slate-900 px-3 py-1.5 text-[11px] font-medium text-white hover:bg-slate-800"
                      >
                        Open careersite
                        <span className="ml-1 text-xs">↗</span>
                      </a>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
