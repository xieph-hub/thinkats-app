// app/admin/applications/page.tsx
import { prisma } from "@/lib/prisma";
import AdminApplicationsClient, {
  AdminApplicationRow,
} from "./AdminApplicationsClient";

export const dynamic = "force-dynamic";

export default async function AdminApplicationsPage() {
  // Fetch latest applications with job + client info
  const applications = await prisma.jobApplication.findMany({
    orderBy: { createdAt: "desc" },
    take: 500, // v1 safety cap
    include: {
      job: {
        select: {
          id: true,
          title: true,
          clientCompany: {
            select: { name: true },
          },
        },
      },
    },
  });

  const rows: AdminApplicationRow[] = applications.map((app) => ({
    id: app.id,
    createdAt: app.createdAt.toISOString(),
    jobId: app.jobId,
    jobTitle: app.job?.title ?? "—",
    clientName: app.job?.clientCompany?.name ?? null,
    fullName: app.fullName,
    email: app.email,
    location: app.location ?? "",
    source: app.source ?? "",
    stage: app.stage,
    status: app.status,
    cvUrl: app.cvUrl,
  }));

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#306B34]">
              Internal
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
              Applications dashboard
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Review candidates across roles, update stages inline, download
              CVs, and export to CSV/Excel.
            </p>
          </div>
        </header>

        <div className="mt-6 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5">
          <AdminApplicationsClient initialRows={rows} />
        </div>
      </section>
    </main>
  );
}
