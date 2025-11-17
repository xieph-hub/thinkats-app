// app/admin/applications/page.tsx
import { prisma } from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";

export const dynamic = "force-dynamic";

type SearchParams = {
  jobId?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  client?: string;
};

export const metadata = {
  title: "Applications | Resourcin Admin",
  description:
    "Review inbound job applications, filter by job/client, and export to CSV.",
};

function escapeCsv(value: unknown): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (s.includes('"') || s.includes(",") || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function buildCsv(apps: any[]): string {
  const header = [
    "CreatedAt",
    "JobTitle",
    "Client",
    "FullName",
    "Email",
    "Phone",
    "Location",
    "LinkedIn",
    "Status",
    "Source",
    "CvPath",
  ];

  const rows = apps.map((app) => [
    app.createdAt?.toISOString?.() ?? "",
    app.job?.title ?? "",
    app.job?.clientCompany?.name ?? "",
    app.fullName ?? "",
    app.email ?? "",
    app.phone ?? "",
    app.location ?? "",
    app.linkedinUrl ?? "",
    app.status ?? "",
    app.source ?? "",
    app.cvUrl ?? "",
  ]);

  return [header, ...rows]
    .map((row) => row.map(escapeCsv).join(","))
    .join("\n");
}

export default async function AdminApplicationsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  noStore();

  const { jobId, status, dateFrom, dateTo, client } = searchParams;

  // --- Filters ---
  const where: any = {};

  if (jobId) {
    where.jobId = jobId;
  }

  if (status && status !== "all") {
    where.status = status;
  }

  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) {
      where.createdAt.gte = new Date(dateFrom);
    }
    if (dateTo) {
      const to = new Date(dateTo);
      to.setDate(to.getDate() + 1); // include the end date fully
      where.createdAt.lte = to;
    }
  }

  if (client) {
    where.job = {
      clientCompany: {
        name: {
          contains: client,
          mode: "insensitive",
        },
      },
    };
  }

  const [applicationsRaw, jobs] = await Promise.all([
    prisma.jobApplication.findMany({
      where,
      include: {
        job: {
          include: {
            clientCompany: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 200, // safety guard
    }),
    prisma.job.findMany({
      orderBy: { title: "asc" },
    }),
  ]);

  // Attach signed CV URLs
  const applications = await Promise.all(
    applicationsRaw.map(async (app) => {
      let cvSignedUrl: string | null = null;

      if (app.cvUrl) {
        try {
          const { data, error } = await supabaseAdmin.storage
            .from("resourcin-uploads")
            .createSignedUrl(app.cvUrl, 60 * 60); // 1 hour

          if (!error && data?.signedUrl) {
            cvSignedUrl = data.signedUrl;
          }
        } catch (err) {
          console.error("Error creating signed CV URL", app.id, err);
        }
      }

      return {
        ...app,
        cvSignedUrl,
      };
    })
  );

  const csvContent = buildCsv(applications);
  const csvHref =
    "data:text/csv;charset=utf-8," + encodeURIComponent(csvContent);

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl">
              Job applications
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Review inbound applications, filter, download CVs, and export to
              CSV.
            </p>
          </div>

          <a
            href={csvHref}
            download="applications.csv"
            className="inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-black"
          >
            Export CSV
          </a>
        </header>

        {/* Filters */}
        <section className="mt-6 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5">
          <form className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {/* Job filter */}
            <div>
              <label className="block text-xs font-medium text-slate-700">
                Job
              </label>
              <select
                name="jobId"
                defaultValue={jobId ?? ""}
                className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs text-slate-900 outline-none focus:border-[#172965]"
              >
                <option value="">All jobs</option>
                {jobs.map((job) => (
                  <option key={job.id} value={job.id}>
                    {job.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Status filter */}
            <div>
              <label className="block text-xs font-medium text-slate-700">
                Status
              </label>
              <select
                name="status"
                defaultValue={status ?? "all"}
                className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs text-slate-900 outline-none focus:border-[#172965]"
              >
                <option value="all">All</option>
                <option value="PENDING">Pending</option>
                <option value="REVIEWING">Reviewing</option>
                <option value="SHORTLISTED">Shortlisted</option>
                <option value="REJECTED">Rejected</option>
                <option value="HIRED">Hired</option>
              </select>
            </div>

            {/* Client filter */}
            <div>
              <label className="block text-xs font-medium text-slate-700">
                Client (contains)
              </label>
              <input
                name="client"
                type="text"
                defaultValue={client ?? ""}
                placeholder="e.g. fintech, logistics"
                className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs text-slate-900 outline-none focus:border-[#172965]"
              />
            </div>

            {/* Date from */}
            <div>
              <label className="block text-xs font-medium text-slate-700">
                From
              </label>
              <input
                name="dateFrom"
                type="date"
                defaultValue={dateFrom ?? ""}
                className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs text-slate-900 outline-none focus:border-[#172965]"
              />
            </div>

            {/* Date to */}
            <div>
              <label className="block text-xs font-medium text-slate-700">
                To
              </label>
              <input
                name="dateTo"
                type="date"
                defaultValue={dateTo ?? ""}
                className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs text-slate-900 outline-none focus:border-[#172965]"
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-5 flex justify-end gap-2 pt-1">
              <Link
                href="/admin/applications"
                className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Reset
              </Link>
              <button
                type="submit"
                className="inline-flex items-center rounded-full bg-[#172965] px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[#111c4c]"
              >
                Apply filters
              </button>
            </div>
          </form>
        </section>

        {/* Table */}
        <section className="mt-6 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5">
          {applications.length === 0 ? (
            <p className="text-sm text-slate-600">
              No applications match the current filters.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-y-1 text-xs">
                <thead>
                  <tr className="text-left text-[0.7rem] uppercase tracking-wide text-slate-500">
                    <th className="px-3 py-2">Date</th>
                    <th className="px-3 py-2">Candidate</th>
                    <th className="px-3 py-2">Job</th>
                    <th className="px-3 py-2">Client</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Source</th>
                    <th className="px-3 py-2">CV</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app) => (
                    <tr
                      key={app.id}
                      className="rounded-lg bg-slate-50/60 align-top hover:bg-slate-50"
                    >
                      <td className="px-3 py-2 align-top text-[0.7rem] text-slate-500">
                        {app.createdAt &&
                          new Date(app.createdAt).toLocaleString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                      </td>
                      <td className="px-3 py-2 align-top">
                        <div className="font-medium text-slate-900">
                          {app.fullName}
                        </div>
                        <div className="text-[0.7rem] text-slate-600">
                          {app.email}
                        </div>
                        {app.location && (
                          <div className="text-[0.7rem] text-slate-500">
                            {app.location}
                          </div>
                        )}
                        {app.linkedinUrl && (
                          <a
                            href={app.linkedinUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-0.5 inline-flex text-[0.7rem] text-[#172965] hover:underline"
                          >
                            LinkedIn
                          </a>
                        )}
                      </td>
                      <td className="px-3 py-2 align-top">
                        <div className="text-[0.75rem] font-medium text-slate-900">
                          {app.job?.title ?? "—"}
                        </div>
                      </td>
                      <td className="px-3 py-2 align-top">
                        <div className="text-[0.75rem] text-slate-800">
                          {app.job?.clientCompany?.name ?? "—"}
                        </div>
                      </td>
                      <td className="px-3 py-2 align-top">
                        <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[0.65rem] font-medium text-slate-700">
                          {app.status}
                        </span>
                      </td>
                      <td className="px-3 py-2 align-top text-[0.7rem] text-slate-600">
                        {app.source ?? "Website"}
                      </td>
                      <td className="px-3 py-2 align-top">
                        {app.cvSignedUrl ? (
                          <a
                            href={app.cvSignedUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex rounded-full bg-slate-900 px-3 py-1 text-[0.7rem] font-medium text-white hover:bg-black"
                          >
                            Download CV
                          </a>
                        ) : (
                          <span className="text-[0.7rem] text-slate-400">
                            No CV
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
