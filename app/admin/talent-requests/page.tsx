// app/admin/talent-requests/page.tsx
import { prisma } from "@/lib/prisma";
import { getDefaultTenant } from "@/lib/tenant";

export const metadata = {
  title: "Talent Requests | Admin | Resourcin",
};

export default async function TalentRequestsAdminPage() {
  const tenant = await getDefaultTenant();

  const requests = await prisma.talentRequest.findMany({
    where: { tenantId: tenant.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Internal · Admin
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-900">
              Talent Requests
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              Last {requests.length} briefs from the Request Talent page.
            </p>
          </div>
        </header>

        {requests.length === 0 ? (
          <p className="mt-10 text-sm text-slate-500">
            No talent requests yet. Once a client submits the form on
            <span className="font-semibold"> /request-talent</span>, they will
            show up here.
          </p>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-100/80 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                <tr>
                  <th className="px-4 py-3">Company / Contact</th>
                  <th className="px-4 py-3">Role(s)</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.map((r) => {
                  const created =
                    r.createdAt instanceof Date
                      ? r.createdAt
                      : new Date(r.createdAt as any);

                  const createdLabel = created.toLocaleString("en-GB", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  });

                  const notesPreview = r.notes
                    ? r.notes.length > 120
                      ? r.notes.slice(0, 120) + "…"
                      : r.notes
                    : null;

                  return (
                    <tr key={r.id} className="align-top hover:bg-slate-50/60">
                      <td className="px-4 py-3 text-xs text-slate-800">
                        <div className="font-semibold text-slate-900">
                          {r.companyName}
                        </div>
                        <div className="mt-0.5 text-[11px] text-slate-500">
                          {r.contactName} · {r.contactEmail}
                          {r.contactPhone ? ` · ${r.contactPhone}` : ""}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-800">
                        <div className="font-medium">{r.roleTitle}</div>
                        {notesPreview && (
                          <p className="mt-1 text-[11px] text-slate-500">
                            {notesPreview}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-700">
                        {r.location || "—"}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-slate-700">
                          {r.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        {createdLabel}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
