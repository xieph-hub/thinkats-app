// app/jobs/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getHostContext } from "@/lib/host";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Jobs | ThinkATS",
  description: "Browse open roles powered by ThinkATS.",
};

type JobsPageSearchParams = {
  q?: string | string[];
  location?: string | string[];
};

function asString(value: string | string[] | undefined): string {
  if (!value) return "";
  if (Array.isArray(value)) return value[0] ?? "";
  return value;
}

export default async function JobsPage({
  searchParams,
}: {
  searchParams?: JobsPageSearchParams;
}) {
  const hostContext = await getHostContext();
  const { isAppHost, tenant, clientCompany, host } = hostContext as any;

  const q = asString(searchParams?.q);
  const locationFilter = asString(searchParams?.location);

  // ------------------------------------------------------
  // Main app host → global jobs marketplace
  // ------------------------------------------------------
  if (isAppHost && !tenant) {
    const where: any = {
      status: "open",
      visibility: "public",
      OR: [{ internalOnly: false }, { internalOnly: null }],
    };

    if (q) {
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { department: { contains: q, mode: "insensitive" } },
        { location: { contains: q, mode: "insensitive" } },
      ];
    }

    if (locationFilter) {
      where.location = {
        contains: locationFilter,
        mode: "insensitive",
      };
    }

    const jobs = await prisma.job.findMany({
      where,
      include: {
        tenant: true,
        clientCompany: true,
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return (
      <main className="min-h-screen bg-slate-950 text-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-10 lg:py-12">
          <header className="mb-6 space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              Jobs marketplace
            </p>
            <h1 className="text-2xl font-semibold text-slate-50 sm:text-3xl">
              Open roles across tenants
            </h1>
            <p className="text-sm text-slate-300">
              These jobs are powered by ThinkATS and managed by our tenants and
              their clients.
            </p>
          </header>

          {jobs.length === 0 ? (
            <p className="mt-4 text-xs text-slate-400">
              No open public roles right now. Check back soon.
            </p>
          ) : (
            <ul className="space-y-3">
              {jobs.map((job) => (
                <li
                  key={job.id}
                  className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 text-xs sm:text-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-medium text-slate-50">{job.title}</p>
                      <p className="mt-0.5 text-[11px] text-slate-400">
                        {(job.clientCompany && job.clientCompany.name) ||
                          (job.tenant && job.tenant.name) ||
                          "Client"}
                      </p>
                    </div>
                    {job.location && (
                      <p className="text-[11px] text-slate-400">
                        {job.location}
                      </p>
                    )}
                  </div>
                  {job.shortDescription && (
                    <p className="mt-2 line-clamp-2 text-xs text-slate-300">
                      {job.shortDescription}
                    </p>
                  )}
                  <div className="mt-3 flex items-center justify-between gap-2 text-[11px] text-slate-400">
                    <span>
                      {job.employmentType && <span>{job.employmentType}</span>}
                      {job.locationType && job.employmentType && " · "}
                      {job.locationType && <span>{job.locationType}</span>}
                    </span>
                    <Link
                      href={`/jobs/${encodeURIComponent(job.slug || job.id)}`}
                      className="font-medium text-sky-400 hover:underline"
                    >
                      View job
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    );
  }

  // ------------------------------------------------------
  // Non-app host but no tenant → soft error
  // ------------------------------------------------------
  if (!tenant) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-slate-50">
        <div className="max-w-md rounded-2xl border border-slate-800 bg-slate-900/70 p-6 text-center">
          <h1 className="text-lg font-semibold">Jobs not available</h1>
          <p className="mt-3 text-sm text-slate-400">
            We couldn&apos;t resolve a tenant for{" "}
            <span className="font-mono text-slate-200">{host}</span>. If you
            expected to see jobs here, please contact ThinkATS support.
          </p>
        </div>
      </main>
    );
  }

  // ------------------------------------------------------
  // Tenant / client host → tenant-specific jobs
  // ------------------------------------------------------
  const whereTenant: any = {
    tenantId: tenant.id,
    status: "open",
    visibility: "public",
    OR: [{ internalOnly: false }, { internalOnly: null }],
  };

  if (clientCompany?.id) {
    whereTenant.clientCompanyId = clientCompany.id;
  }

  if (q) {
    whereTenant.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { department: { contains: q, mode: "insensitive" } },
      { location: { contains: q, mode: "insensitive" } },
    ];
  }

  if (locationFilter) {
    whereTenant.location = {
      contains: locationFilter,
      mode: "insensitive",
    };
  }

  const jobs = await prisma.job.findMany({
    where: whereTenant,
    include: {
      clientCompany: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const displayName =
    clientCompany?.name || tenant.name || (tenant as any).slug || host;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-10 lg:py-12">
        <header className="mb-6 space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            Jobs
          </p>
          <h1 className="text-2xl font-semibold text-slate-50 sm:text-3xl">
            All jobs at {displayName}
          </h1>
          <p className="text-sm text-slate-300">
            These are the public, open roles currently available.
          </p>
        </header>

        {jobs.length === 0 ? (
          <p className="mt-4 text-xs text-slate-400">
            There are no open public roles at the moment. Check back soon.
          </p>
        ) : (
          <ul className="space-y-3">
            {jobs.map((job) => (
              <li
                key={job.id}
                className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 text-xs sm:text-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium text-slate-50">{job.title}</p>
                    {job.clientCompany && (
                      <p className="mt-0.5 text-[11px] text-slate-400">
                        {job.clientCompany.name}
                      </p>
                    )}
                  </div>
                  {job.location && (
                    <p className="text-[11px] text-slate-400">
                      {job.location}
                    </p>
                  )}
                </div>
                {job.shortDescription && (
                  <p className="mt-2 line-clamp-2 text-xs text-slate-300">
                    {job.shortDescription}
                  </p>
                )}
                <div className="mt-3 flex items-center justify-between gap-2 text-[11px] text-slate-400">
                  <span>
                    {job.employmentType && <span>{job.employmentType}</span>}
                    {job.locationType && job.employmentType && " · "}
                    {job.locationType && <span>{job.locationType}</span>}
                  </span>
                  <Link
                    href={`/jobs/${encodeURIComponent(job.slug || job.id)}`}
                    className="font-medium text-sky-400 hover:underline"
                  >
                    View job
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
