import { prisma } from "@/lib/prisma";
import AdminApplicationsTable, {
  AdminApplicationRow,
} from "@/components/AdminApplicationsTable";

export const dynamic = "force-dynamic";

export default async function ApplicationsAdminPage() {
  const applications = await prisma.jobApplication.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      job: {
        include: {
          clientCompany: true,
        },
      },
    },
  });

  const rows: AdminApplicationRow[] = applications.map((app) => ({
    id: app.id,
    fullName: app.fullName,
    email: app.email,
    phone: app.phone ?? "",
    location: app.location ?? "",
    stage: String(app.stage),
    status: String(app.status),
    source: app.source ?? "Website",
    createdAt: app.createdAt.toISOString(),
    jobTitle: app.job?.title ?? "",
    jobSlug: app.job?.slug ?? "",
    jobLocation: app.job?.location ?? "",
    jobSeniority: app.job?.seniority ?? "",
    cvUrl: app.cvUrl ?? "",
    clientName: app.job?.clientCompany?.name ?? "",
  }));

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#306B34]">
              Internal
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              Job applications
            </h1>
            <p className="mt-2 max-w-xl text-sm text-slate-600">
              Lightweight admin view of all applications submitted via the
              Resourcin website. Filter by job, client, date range, and export
              to CSV.
            </p>
          </div>
          <div className="text-sm text-slate-500">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
              Total applications:{" "}
              <span className="font-semibold text-slate-900">
                {applications.length}
              </span>
            </span>
          </div>
        </header>

        {/* Table + filters + export handled in client component */}
        <AdminApplicationsTable applications={rows} />

        {/* Back link */}
        <div>
          <a
            href="/"
            className="inline-flex items-center text-xs text-slate-600 hover:text-slate-900"
          >
            ← Back to site
          </a>
        </div>
      </div>
    </main>
  );
}
