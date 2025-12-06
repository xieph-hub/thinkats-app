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

  const baseWhere: any = {
    tenantId: tenant.id,
  };

  const where: any = { ...baseWhere };

  if (filterQ) {
    where.OR = [
      { title: { contains: filterQ, mode: "insensitive" } },
      { location: { contains: filterQ, mode: "insensitive" } },
      { department: { contains: filterQ, mode: "insensitive" } },
      {
        clientCompany: {
          name: { contains: filterQ, mode: "insensitive" },
        },
      },
    ];
  }

  if (filterStatus === "PUBLISHED") {
    // canonical “published” definition: open + public
    where.status = "open";
    where.visibility = "public";
  } else if (filterStatus === "UNPUBLISHED") {
    // everything that is NOT open+public
    where.OR = [
      { status: { not: "open" } },
      { visibility: { not: "public" } },
    ];
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

    const status: string = anyJob.status ?? (job.isPublished ? "open" : "draft");
    const visibility: string =
      anyJob.visibility ?? (job.isPublished ? "public" : "internal");

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
    <div className="flex h-full flex-1 flex-col">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white px-5 py-4">
        <div className="mb-2 flex items-center gap-2 text-xs text-slate-500">
          <Link href="/ats/jobs" className="hover:underline">
            ATS
          </Link>
          <span>/</span>
          <span className="font-medium text-slate-700">Jobs</span>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-base font-semibold text-slate-900">
              Jobs
            </h1>
            <p className="mt-0.5 text-[11px] text-slate-500">
              All open and draft roles in this workspace. Search, filter
              and manage publishing directly from here.
            </p>
          </div>

          <div className="flex flex-col items-end text-right text-[11px] text-slate-500">
            <span className="font-medium text-slate-800">
              {tenant.name}
            </span>
            <span className="text-[10px] text-slate-400">
              {visibleJobs} of {totalJobs} jobs visible ·{" "}
              <span className="font-semibold text-emerald-700">
                {publishedJobs}
              </span>{" "}
              published
            </span>
            <Link
              href="/ats/jobs/new"
              className="mt-2 inline-flex h-8 items-center rounded-full bg-slate-900 px-4 text-[11px] font-semibold text-white hover:bg-slate-800"
            >
              + Create job
            </Link>
          </div>
        </div>
      </header>

      {/* Filters + table */}
      <main className="flex flex-1 flex-col bg-slate-50 px-5 py-4">
        {/* Filters row */}
        <section className="mb-3 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-[11px] text-slate-700">
          <form className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              name="q"
              defaultValue={filterQ}
              placeholder="Search by title, client, location…"
              className="h-8 min-w-[220px] flex-1 rounded-full border border-slate-200 bg-white px-3 text-[11px] text-slate-800"
            />
            <select
              name="status"
              defaultValue={filterStatus === "ALL" ? "" : filterStatus}
              className="h-8 w-[150px] rounded-full border border-slate-200 bg-white px-3 text-[11px] text-slate-800"
            >
              <option value="">All statuses</option>
              <option value="PUBLISHED">Published</option>
              <option value="UNPUBLISHED">Unpublished</option>
            </select>
            <button
              type="submit"
              className="inline-flex h-8 items-center rounded-full bg-slate-900 px-4 text-[11px] font-semibold text-white hover:bg-slate-800"
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

          <div className="flex items-center justify-between text-[10px] text-slate-500">
            <span>
              Use bulk actions below to publish/unpublish multiple jobs
              in one go.
            </span>
          </div>
        </section>

        {/* Jobs table + bulk actions */}
        <AtsJobsTable initialJobs={jobs} />
      </main>
    </div>
  );
}
