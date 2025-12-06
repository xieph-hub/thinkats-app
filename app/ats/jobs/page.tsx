// app/ats/jobs/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getResourcinTenant } from "@/lib/tenant";
import AtsJobsTable, { AtsJobRow } from "./AtsJobsTable";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ThinkATS | Jobs",
  description:
    "Workspace-wide view of open and draft roles, with bulk actions and publishing controls.",
};

type JobsPageSearchParams = {
  q?: string | string[];
  status?: string | string[];
};

type PageProps = {
  searchParams?: JobsPageSearchParams;
};

function firstString(value?: string | string[]): string {
  if (Array.isArray(value)) return value[0] || "";
  return value || "";
}

export default async function AtsJobsPage({ searchParams = {} }: PageProps) {
  const tenant = await getResourcinTenant();
  if (!tenant) notFound();

  const filterQ = firstString(searchParams.q).trim();
  const rawStatus = firstString(searchParams.status).trim().toUpperCase();
  const filterStatus =
    rawStatus === "PUBLISHED" || rawStatus === "UNPUBLISHED"
      ? rawStatus
      : "ALL";

  // Base scope: tenant-wide
  const baseWhere: any = {
    tenantId: tenant.id,
  };

  // Build filters using AND clauses so search + status can combine cleanly
  const where: any = { ...baseWhere };
  const andClauses: any[] = [];

  if (filterQ) {
    andClauses.push({
      OR: [
        { title: { contains: filterQ, mode: "insensitive" } },
        { location: { contains: filterQ, mode: "insensitive" } },
        { department: { contains: filterQ, mode: "insensitive" } },
        {
          clientCompany: {
            name: { contains: filterQ, mode: "insensitive" },
          },
        },
      ],
    });
  }

  if (filterStatus === "PUBLISHED") {
    // Canonical “published” definition: open + public
    andClauses.push({
      status: "open",
      visibility: "public",
    });
  } else if (filterStatus === "UNPUBLISHED") {
    // Everything that is NOT open+public
    andClauses.push({
      OR: [
        { status: { not: "open" } },
        { visibility: { not: "public" } },
      ],
    });
  }

  if (andClauses.length > 0) {
    where.AND = andClauses;
  }

  const [totalJobs, jobsRaw] = await Promise.all([
    prisma.job.count({ where: baseWhere }),
    prisma.job.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        clientCompany: true,
        _count: {
          select: { applications: true },
        },
      },
    }),
  ]);

  const jobs: AtsJobRow[] = jobsRaw.map((job) => {
    const anyJob = job as any;

    const workMode = anyJob.workMode ?? anyJob.locationType ?? null;
    const experienceLevel =
      anyJob.experienceLevel ?? anyJob.seniority ?? null;

    const status: string = anyJob.status ?? "draft";
    const visibility: string = anyJob.visibility ?? "public";

    return {
      id: job.id,
      title: job.title,
      clientName: job.clientCompany?.name ?? "",
      location: job.location ?? null,
      workMode,
      employmentType: anyJob.employmentType ?? null,
      experienceLevel,
      status,
      visibility,
      applicationsCount: job._count.applications ?? 0,
      createdAt: job.createdAt.toISOString(),
    };
  });

  const visibleJobs = jobs.length;
  const publishedJobs = jobs.filter(
    (j) =>
      j.status.toLowerCase() === "open" &&
      j.visibility.toLowerCase() === "public",
  ).length;

  return (
    <div className="flex h-full flex-1 flex-col bg-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-gradient-to-b from-slate-50 to-white px-5 py-4">
        <div className="mb-2 flex items-center gap-2 text-xs text-slate-500">
          <Link href="/ats/jobs" className="hover:underline">
            ATS
          </Link>
          <span>/</span>
          <span className="font-medium text-slate-700">Jobs</span>
        </div>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1.5">
            <h1 className="text-base font-semibold text-slate-900">
              Jobs overview
            </h1>
            <p className="max-w-xl text-[11px] text-slate-500">
              Command-centre view of all open, draft and closed roles in this
              workspace. Search, filter and run bulk publishing actions without
              leaving this screen.
            </p>

            {/* Quick stats bar */}
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px]">
              <span className="inline-flex items-center gap-1 rounded-full bg-[#E5F0FF] px-2 py-0.5 font-medium text-[#1D4ED8]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#2563EB]" />
                {publishedJobs} published roles
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                {visibleJobs} visible in this view
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-slate-500">
                Total in workspace:{" "}
                <span className="font-medium text-slate-800">
                  {totalJobs}
                </span>
              </span>
            </div>
          </div>

          <div className="flex flex-col items-end text-right text-[11px] text-slate-500">
            <span className="font-medium text-slate-800">
              {tenant.name}
            </span>
            <span className="text-[10px] text-slate-400">
              Workspace-level controls for this tenant
            </span>
            <Link
              href="/ats/jobs/new"
              className="mt-3 inline-flex h-8 items-center rounded-full bg-[#2563EB] px-4 text-[11px] font-semibold text-white shadow-sm shadow-blue-100 hover:bg-[#1D4ED8]"
            >
              + Create job
            </Link>
          </div>
        </div>
      </header>

      {/* Filters + table */}
      <main className="flex flex-1 flex-col bg-slate-50 px-5 py-4">
        {/* Filters row */}
        <section className="mb-4 rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_6px_20px_rgba(15,23,42,0.04)]">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-0.5">
              <h2 className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Filters &amp; search
              </h2>
              <p className="text-[10px] text-slate-500">
                Narrow down by title, client, location or publication state.
                Results update when you apply filters.
              </p>
            </div>
            <div className="hidden items-center gap-2 text-[10px] text-slate-400 sm:flex">
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Open + public &rarr;{" "}
                <span className="font-medium text-slate-700">
                  Published
                </span>
              </span>
            </div>
          </div>

          <form className="flex flex-wrap items-center gap-2">
            <div className="flex min-w-[220px] flex-1 items-center gap-2">
              <div className="relative flex-1">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-[10px] text-slate-400">
                  🔍
                </span>
                <input
                  type="text"
                  name="q"
                  defaultValue={filterQ}
                  placeholder="Search by title, client, location…"
                  className="h-8 w-full rounded-full border border-slate-200 bg-slate-50 pl-7 pr-3 text-[11px] text-slate-800 placeholder:text-slate-400 focus:border-[#2563EB] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                />
              </div>
            </div>

            <select
              name="status"
              defaultValue={filterStatus === "ALL" ? "" : filterStatus}
              className="h-8 w-[150px] rounded-full border border-slate-200 bg-slate-50 px-3 text-[11px] text-slate-800 focus:border-[#2563EB] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
            >
              <option value="">All statuses</option>
              <option value="PUBLISHED">Published</option>
              <option value="UNPUBLISHED">Unpublished</option>
            </select>

            <button
              type="submit"
              className="inline-flex h-8 items-center rounded-full bg-[#2563EB] px-4 text-[11px] font-semibold text-white hover:bg-[#1D4ED8]"
            >
              Apply filters
            </button>
            <Link
              href="/ats/jobs"
              className="inline-flex h-8 items-center rounded-full border border-slate-200 bg-white px-3 text-[11px] text-slate-600 hover:bg-slate-50"
            >
              Reset
            </Link>
          </form>

          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-500">
            <span>
              Use the checkboxes in the table below to select jobs and run{" "}
              <span className="font-medium text-slate-700">
                bulk publish / unpublish / close
              </span>{" "}
              actions.
            </span>
          </div>
        </section>

        {/* Jobs table + bulk actions */}
        <AtsJobsTable initialJobs={jobs} />
      </main>
    </div>
  );
}
