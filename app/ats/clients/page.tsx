// app/ats/clients/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getResourcinTenant } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Clients | ThinkATS",
  description:
    "View and manage recruitment clients attached to the current ThinkATS workspace.",
};

type ClientsSearchParams = {
  created?: string;
  updated?: string;
};

export default async function ClientsPage({
  searchParams,
}: {
  searchParams?: ClientsSearchParams;
}) {
  const tenant = await getResourcinTenant();
  if (!tenant) {
    return (
      <div className="px-4 py-8">
        <h1 className="text-xl font-semibold text-slate-900">
          Clients not available
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          No default tenant is configured. Check your tenant environment
          variables.
        </p>
      </div>
    );
  }

  const clients = await prisma.clientCompany.findMany({
    where: { tenantId: tenant.id },
    orderBy: { name: "asc" },
  });

  const created = searchParams?.created === "1";
  const updated = searchParams?.updated === "1";

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            ATS · Clients
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-900">
            Recruitment clients
          </h1>
          <p className="mt-1 text-xs text-slate-600">
            Companies you recruit for under this workspace. Attach jobs to
            clients to keep pipelines and reporting clean.
          </p>
        </div>

        <Link
          href="/ats/clients/new"
          className="inline-flex items-center rounded-md bg-[#172965] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#12204d]"
        >
          + New client
        </Link>
      </div>

      {/* Alerts */}
      {created && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] text-emerald-800">
          Client created.
        </div>
      )}
      {updated && (
        <div className="rounded-md border border-slate-200 bg-slate-100 px-3 py-2 text-[11px] text-slate-800">
          Client updated.
        </div>
      )}

      {/* List */}
      {clients.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
          No clients yet. Create your first client to start attaching jobs
          and pipelines.
        </div>
      ) : (
        <div className="space-y-2">
          {clients.map((client) => {
            const createdAt = (client as any).createdAt as Date | undefined;
            const createdLabel =
              createdAt && !Number.isNaN(createdAt.getTime())
                ? createdAt.toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "2-digit",
                  })
                : null;

            return (
              <div
                key={client.id}
                className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-semibold text-slate-900">
                      {client.name}
                    </span>
                  </div>
                  {createdLabel && (
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      Added {createdLabel}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/ats/clients/${client.id}/edit`}
                    className="text-[11px] font-medium text-[#172965] hover:underline"
                  >
                    Edit
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
