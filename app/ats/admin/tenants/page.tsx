// app/ats/admin/tenants/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getServerUser } from "@/lib/auth/getServerUser";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ThinkATS | Admin · Workspaces",
  description:
    "Super admin overview of all ATS workspaces, with tools to create new tenants and invite owners.",
};

type PageSearchParams = {
  created?: string;
  invited?: string;
  error?: string;
};

export default async function AdminTenantsPage({
  searchParams,
}: {
  searchParams?: PageSearchParams;
}) {
  const user = await getServerUser();

  // 🔐 Super admin gate – only SUPER_ADMIN sees this
  if (!user || user.globalRole !== "SUPER_ADMIN") {
    notFound();
  }

  const [tenants] = await Promise.all([
    prisma.tenant.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            jobs: true,
            candidates: true,
            userTenantRoles: true,
          },
        },
      },
    }),
  ]);

  const created = searchParams?.created === "1";
  const invited = searchParams?.invited === "1";
  const errorMessage = searchParams?.error;

  return (
    <div className="flex h-full flex-1 flex-col bg-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white px-5 py-4">
        <div className="mb-2 flex items-center gap-2 text-xs text-slate-500">
          <Link href="/ats/dashboard" className="hover:underline">
            ATS
          </Link>
          <span>/</span>
          <span className="hover:underline">Admin</span>
          <span>/</span>
          <span className="font-medium text-slate-700">Workspaces</span>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-base font-semibold text-slate-900">
              Workspaces & tenants
            </h1>
            <p className="mt-0.5 text-[11px] text-slate-500">
              Super admin–only view of all tenants running on ThinkATS. Create
              new workspaces, assign plans and invite owners from one place.
            </p>
          </div>

          <div className="flex flex-col items-end text-right text-[11px] text-slate-500">
            <span className="font-medium text-slate-800">
              {user.email ?? "Super admin"}
            </span>
            <span className="text-[10px] text-slate-400">
              {tenants.length} workspace
              {tenants.length === 1 ? "" : "s"} on this cluster
            </span>
          </div>
        </div>
      </header>

      {/* Body */}
      <main className="flex flex-1 flex-col px-5 py-4">
        {/* Alerts */}
        <div className="mx-auto mb-4 flex w-full max-w-6xl flex-col gap-2">
          {created && (
            <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] text-emerald-800">
              Workspace created. You can now invite an owner and wire billing
              and careers settings.
            </div>
          )}
          {invited && (
            <div className="rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-[11px] text-sky-800">
              Invitation sent to workspace owner. They&apos;ll receive an email
              with next steps.
            </div>
          )}
          {errorMessage && (
            <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] text-rose-800">
              {errorMessage}
            </div>
          )}
        </div>

        <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[minmax(0,2.1fr)_minmax(0,1.4fr)]">
          {/* LEFT: Forms */}
          <section className="space-y-6">
            {/* Create workspace */}
            <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">
                    Create workspace
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Spin up a new tenant for an agency or in-house team. You can
                    refine plans and limits later from billing.
                  </p>
                </div>
                <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-slate-600">
                  Admin only
                </span>
              </div>

              <form
                method="POST"
                action="/api/ats/admin/workspaces"
                className="space-y-4 text-xs text-slate-700"
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-[11px] font-medium text-slate-700"
                    >
                      Workspace name
                    </label>
                    <input
                      id="name"
                      name="name"
                      required
                      placeholder="Resourcin Human Capital Advisors"
                      className="mt-1 block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
                    />
                    <p className="mt-1 text-[10px] text-slate-500">
                      Human-readable label used in the ATS header and emails.
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="slug"
                      className="block text-[11px] font-medium text-slate-700"
                    >
                      Workspace slug
                    </label>
                    <div className="mt-1 flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
                      <span className="hidden text-[11px] text-slate-400 sm:inline">
                        *.thinkats.com /
                      </span>
                      <input
                        id="slug"
                        name="slug"
                        required
                        placeholder="resourcin"
                        className="flex-1 border-none bg-transparent text-xs text-slate-900 outline-none ring-0 placeholder:text-slate-400"
                      />
                    </div>
                    <p className="mt-1 text-[10px] text-slate-500">
                      Used for subdomains and routing. Lowercase, numbers and
                      dashes only.
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="primaryContactEmail"
                      className="block text-[11px] font-medium text-slate-700"
                    >
                      Primary contact email
                    </label>
                    <input
                      id="primaryContactEmail"
                      name="primaryContactEmail"
                      type="email"
                      placeholder="talent@client.com"
                      className="mt-1 block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
                    />
                    <p className="mt-1 text-[10px] text-slate-500">
                      Where owner invites and billing emails should go by
                      default.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label
                        htmlFor="planTier"
                        className="block text-[11px] font-medium text-slate-700"
                      >
                        Plan
                      </label>
                      <select
                        id="planTier"
                        name="planTier"
                        defaultValue="STARTER"
                        className="mt-1 block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-900 outline-none focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
                      >
                        <option value="STARTER">Starter</option>
                        <option value="GROWTH">Growth</option>
                        <option value="AGENCY">Agency</option>
                        <option value="ENTERPRISE">Enterprise</option>
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="seats"
                        className="block text-[11px] font-medium text-slate-700"
                      >
                        Seats
                      </label>
                      <input
                        id="seats"
                        name="seats"
                        type="number"
                        min={1}
                        defaultValue={3}
                        className="mt-1 block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
                      />
                      <p className="mt-1 text-[10px] text-slate-500">
                        Initial seat limit for this workspace.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="maxOpenJobs"
                      className="block text-[11px] font-medium text-slate-700"
                    >
                      Max open jobs (optional)
                    </label>
                    <input
                      id="maxOpenJobs"
                      name="maxOpenJobs"
                      type="number"
                      min={0}
                      placeholder="Unlimited"
                      className="mt-1 block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label
                        htmlFor="defaultTimezone"
                        className="block text-[11px] font-medium text-slate-700"
                      >
                        Default timezone
                      </label>
                      <input
                        id="defaultTimezone"
                        name="defaultTimezone"
                        placeholder="Africa/Lagos"
                        className="mt-1 block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="defaultCurrency"
                        className="block text-[11px] font-medium text-slate-700"
                      >
                        Default currency
                      </label>
                      <input
                        id="defaultCurrency"
                        name="defaultCurrency"
                        placeholder="USD"
                        className="mt-1 block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <p className="text-[10px] text-slate-500">
                    This will create a new{" "}
                    <span className="font-medium">Tenant</span> row, scoped to
                    your ThinkATS cluster. No jobs or users are created yet.
                  </p>
                  <button
                    type="submit"
                    className="inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-[11px] font-semibold text-white shadow-sm hover:bg-slate-800"
                  >
                    + Create workspace
                  </button>
                </div>
              </form>
            </section>

            {/* Invite owner */}
            <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">
                    Invite workspace owner
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Send an owner-level invite into any tenant. This uses the{" "}
                    <code className="rounded bg-slate-100 px-1 py-0.5 text-[10px]">
                      /api/ats/tenants/[tenantId]/users/invite
                    </code>{" "}
                    endpoint.
                  </p>
                </div>
                <span className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-[10px] font-medium text-indigo-700">
                  Owner access
                </span>
              </div>

              <form
                method="POST"
                // NOTE: tenantId comes from the select below as a field,
                // backend should read `tenantId` from the body and route internally
                action="/api/ats/tenants/owner-invite"
                className="space-y-4 text-xs text-slate-700"
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="tenantId"
                      className="block text-[11px] font-medium text-slate-700"
                    >
                      Workspace
                    </label>
                    <select
                      id="tenantId"
                      name="tenantId"
                      required
                      className="mt-1 block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-900 outline-none focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
                    >
                      <option value="">Select workspace…</option>
                      {tenants.map((tenant) => (
                        <option key={tenant.id} value={tenant.id}>
                          {tenant.name}{" "}
                          {tenant.slug ? ` (${tenant.slug})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="email"
                      className="block text-[11px] font-medium text-slate-700"
                    >
                      Owner email
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      placeholder="owner@client.com"
                      className="mt-1 block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
                    />
                    <p className="mt-1 text-[10px] text-slate-500">
                      This user will receive an email to accept the invite and
                      complete setup.
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="role"
                      className="block text-[11px] font-medium text-slate-700"
                    >
                      Role
                    </label>
                    <select
                      id="role"
                      name="role"
                      defaultValue="OWNER"
                      className="mt-1 block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-900 outline-none focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
                    >
                      <option value="OWNER">Owner</option>
                      <option value="ADMIN">Admin</option>
                      <option value="RECRUITER">Recruiter</option>
                      <option value="VIEWER">Viewer</option>
                    </select>
                    <p className="mt-1 text-[10px] text-slate-500">
                      You can downgrade later from the workspace members page.
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="message"
                      className="block text-[11px] font-medium text-slate-700"
                    >
                      Personal message (optional)
                    </label>
                    <input
                      id="message"
                      name="message"
                      placeholder="Short note to include in the invite email"
                      className="mt-1 block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <p className="text-[10px] text-slate-500">
                    The API will create a{" "}
                    <code className="rounded bg-slate-100 px-1 py-0.5 text-[10px]">
                      tenant_invitations
                    </code>{" "}
                    row and send via your email provider.
                  </p>
                  <button
                    type="submit"
                    className="inline-flex items-center rounded-full bg-indigo-600 px-4 py-2 text-[11px] font-semibold text-white shadow-sm hover:bg-indigo-700"
                  >
                    Send owner invite
                  </button>
                </div>
              </form>
            </section>
          </section>

          {/* RIGHT: Tenants overview */}
          <aside className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-900">
                Workspace inventory
              </h2>
              <p className="mt-1 text-[11px] text-slate-500">
                High-level view of all tenants, plans and usage. This is read-
                only; changes happen via billing and the admin APIs.
              </p>

              <div className="mt-3 max-h-[460px] overflow-y-auto rounded-xl border border-slate-100">
                <table className="min-w-full border-separate border-spacing-0 text-[11px] text-slate-700">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500">
                      <th className="border-b border-slate-200 px-3 py-2 text-left">
                        Workspace
                      </th>
                      <th className="border-b border-slate-200 px-3 py-2 text-left">
                        Plan
                      </th>
                      <th className="border-b border-slate-200 px-3 py-2 text-center">
                        Seats
                      </th>
                      <th className="border-b border-slate-200 px-3 py-2 text-center">
                        Jobs
                      </th>
                      <th className="border-b border-slate-200 px-3 py-2 text-center">
                        Candidates
                      </th>
                      <th className="border-b border-slate-200 px-3 py-2 text-right">
                        Created
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {tenants.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-3 py-6 text-center text-[11px] text-slate-500"
                        >
                          No workspaces yet. Use{" "}
                          <span className="font-medium">
                            Create workspace
                          </span>{" "}
                          to add your first tenant.
                        </td>
                      </tr>
                    ) : (
                      tenants.map((tenant, idx) => {
                        const createdDate =
                          tenant.createdAt.toISOString().slice(0, 10);
                        const tierLabel = (tenant as any).planTier ?? "STARTER";
                        const seats = (tenant as any).seats ?? 0;

                        return (
                          <tr
                            key={tenant.id}
                            className={
                              idx % 2 === 0 ? "bg-white" : "bg-slate-50/60"
                            }
                          >
                            <td className="border-b border-slate-100 px-3 py-2 align-top">
                              <div className="flex flex-col gap-0.5">
                                <span className="text-[11px] font-semibold text-slate-900">
                                  {tenant.name}
                                </span>
                                <span className="text-[10px] text-slate-500">
                                  {tenant.slug
                                    ? `${tenant.slug}.thinkats.com`
                                    : tenant.id}
                                </span>
                              </div>
                            </td>
                            <td className="border-b border-slate-100 px-3 py-2 align-top">
                              <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-medium text-slate-700">
                                {formatPlanTier(tierLabel)}
                              </span>
                            </td>
                            <td className="border-b border-slate-100 px-3 py-2 text-center align-top">
                              <span className="text-[10px] text-slate-700">
                                {seats || "—"}
                              </span>
                            </td>
                            <td className="border-b border-slate-100 px-3 py-2 text-center align-top">
                              <span className="text-[10px] text-slate-700">
                                {tenant._count.jobs}
                              </span>
                            </td>
                            <td className="border-b border-slate-100 px-3 py-2 text-center align-top">
                              <span className="text-[10px] text-slate-700">
                                {tenant._count.candidates}
                              </span>
                            </td>
                            <td className="border-b border-slate-100 px-3 py-2 text-right align-top">
                              <span className="text-[10px] text-slate-500">
                                {createdDate}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              <p className="mt-3 text-[10px] text-slate-500">
                For deeper metrics (conversion, time-to-hire, source
                performance), use{" "}
                <Link
                  href="/ats/analytics"
                  className="font-medium text-[#172965] hover:underline"
                >
                  ATS analytics
                </Link>
                .
              </p>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

// Small helper – keep labels nice even if planTier is null / lowercase
function formatPlanTier(raw: string): string {
  const upper = (raw || "").toUpperCase();
  switch (upper) {
    case "STARTER":
      return "Starter";
    case "GROWTH":
      return "Growth";
    case "AGENCY":
      return "Agency";
    case "ENTERPRISE":
      return "Enterprise";
    default:
      return raw || "Starter";
  }
}
