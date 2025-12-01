// app/ats/clients/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getResourcinTenant } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Clients | ThinkATS",
  description: "Client workspaces managed in this ATS environment.",
};

export default async function ClientsIndexPage({
  searchParams,
}: {
  searchParams?: { created?: string; error?: string };
}) {
  const tenant = await getResourcinTenant();
  if (!tenant) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-xl font-semibold text-slate-900">
          Workspace not available
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          No default tenant configured.
        </p>
      </div>
    );
  }

  const clients = await prisma.clientCompany.findMany({
    where: { tenantId: tenant.id },
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { jobs: true },
      },
    },
  });

  const created = searchParams?.created === "1";
  const errorMessage = searchParams?.error;

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6">
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Clients</h1>
          <p className="mt-1 text-xs text-slate-600">
            Each client represents a company that you run searches for under
            this workspace.
          </p>
        </div>
        <Link
          href="/ats/clients/new"
          className="inline-flex items-center rounded-md bg-[#172965] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#12204d]"
        >
          New client
        </Link>
      </div>

      {created && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] text-emerald-800">
          Client created.
        </div>
      )}

      {errorMessage && (
        <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] text-rose-800">
          {errorMessage}
        </div>
      )}

      {clients.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
          <p>No clients yet.</p>
          <p className="mt-1 text-[11px]">
            Use the button above to add your first recruitment client.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {clients.map((client) => {
            const jobsCount = (client as any)._count?.jobs ?? 0;
            const created = new Date(client.createdAt).toLocaleDateString(
              undefined,
              { year: "numeric", month: "short", day: "2-digit" },
            );

            return (
              <article
                key={client.id}
                className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 text-xs text-slate-700 shadow-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <h2 className="truncate text-sm font-semibold text-slate-900">
                    {client.name}
                  </h2>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    {(client.industry && `${client.industry} · `) || ""}
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
                    Added {created}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-2">
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

                  <div className="flex gap-2">
                    <Link
                      href={`/ats/clients/${client.id}/edit`}
                      className="inline-flex items-center rounded-md border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-medium text-slate-700 hover:border-[#172965] hover:text-[#172965]"
                    >
                      Edit
                    </Link>
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
