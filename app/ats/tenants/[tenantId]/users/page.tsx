// app/ats/tenants/[tenantId]/users/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ensureOtpVerified } from "@/lib/requireOtp";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Workspace users | ThinkATS",
  description:
    "Manage who has access to this ATS workspace and their roles.",
};

type PageProps = {
  params: { tenantId: string };
  searchParams?: {
    invited?: string;
    email?: string;
    error?: string;
  };
};

function formatDate(value: any): string {
  if (!value) return "";
  const d =
    typeof value === "string" || typeof value === "number"
      ? new Date(value)
      : value;
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function roleLabel(role: string | null | undefined): string {
  const r = (role || "").toUpperCase();
  switch (r) {
    case "OWNER":
      return "Owner";
    case "ADMIN":
      return "Admin";
    case "RECRUITER":
      return "Recruiter";
    case "VIEWER":
      return "Viewer";
    default:
      return "Member";
  }
}

function roleClasses(role: string | null | undefined): string {
  const r = (role || "").toUpperCase();
  switch (r) {
    case "OWNER":
      return "bg-[#172965]/10 text-[#172965] ring-[#172965]/30";
    case "ADMIN":
      return "bg-[#306B34]/10 text-[#306B34] ring-[#306B34]/30";
    case "RECRUITER":
      return "bg-[#FFC000]/10 text-[#92400E] ring-[#FBBF24]/50";
    case "VIEWER":
      return "bg-slate-50 text-slate-600 ring-slate-200";
    default:
      return "bg-slate-50 text-slate-600 ring-slate-200";
  }
}

function statusLabel(status: string | null | undefined): string {
  const s = (status || "").toUpperCase();
  switch (s) {
    case "INVITED":
      return "Invited";
    case "ACTIVE":
      return "Active";
    case "SUSPENDED":
      return "Suspended";
    default:
      return "Active";
  }
}

function statusClasses(status: string | null | undefined): string {
  const s = (status || "").toUpperCase();
  switch (s) {
    case "INVITED":
      return "bg-amber-50 text-amber-700 ring-amber-100";
    case "ACTIVE":
      return "bg-emerald-50 text-emerald-700 ring-emerald-100";
    case "SUSPENDED":
      return "bg-rose-50 text-rose-700 ring-rose-100";
    default:
      return "bg-emerald-50 text-emerald-700 ring-emerald-100";
  }
}

export default async function TenantUsersPage({
  params,
  searchParams,
}: PageProps) {
  const tenantId = params.tenantId;

  // 🔐 OTP gate for ATS
  await ensureOtpVerified(`/ats/tenants/${tenantId}/users`);

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      id: true,
      name: true,
      slug: true,
      createdAt: true,
    },
  });

  if (!tenant) {
    notFound();
  }

  const [memberships, invitations] = await Promise.all([
    prisma.tenantMembership.findMany({
      where: { tenantId },
      include: {
        user: true,
        invitedBy: true,
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.tenantInvitation.findMany({
      where: {
        tenantId,
        usedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const hasOwner = memberships.some(
    (m) => (m.role || "").toUpperCase() === "OWNER",
  );

  const invited = searchParams?.invited === "1";
  const invitedEmail = searchParams?.email || "";
  const errorCode = searchParams?.error;

  let errorMessage: string | null = null;
  if (errorCode === "missing_email") {
    errorMessage = "Email is required to invite a new user.";
  } else if (errorCode === "tenant_not_found") {
    errorMessage = "Tenant not found. Please refresh and try again.";
  } else if (errorCode === "invite_failed") {
    errorMessage =
      "Something went wrong while sending the invitation. Please try again.";
  }

  const tenantLabel = tenant.name || tenant.slug || "Workspace";

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 lg:px-0">
      {/* Header */}
      <header className="space-y-1 border-b border-slate-200 pb-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          ATS · Workspace users
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold text-slate-900">
            Users &amp; access
          </h1>
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] text-slate-600">
            {tenantLabel}
          </span>
          {tenant.slug && (
            <span className="rounded-full bg-slate-50 px-2.5 py-0.5 text-[10px] text-slate-500">
              slug: <span className="font-mono">{tenant.slug}</span>
            </span>
          )}
        </div>
        <p className="max-w-2xl text-xs text-slate-600">
          Control who can access this ATS workspace, what they can do, and keep
          an audit trail of invites.
        </p>
      </header>

      {/* Alerts */}
      {invited && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] text-emerald-800">
          Invitation sent to{" "}
          <span className="font-semibold">{invitedEmail}</span>. They&apos;ll
          get an email with a secure link to join this workspace.
        </div>
      )}
      {errorMessage && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-700">
          {errorMessage}
        </div>
      )}

      {/* Layout: current users + invite form */}
      <div className="grid gap-6 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        {/* Current users */}
        <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Current users
              </h2>
              <p className="text-[11px] text-slate-500">
                Everyone who currently has access to this workspace, including
                their role and status.
              </p>
            </div>
            <span className="inline-flex items-center rounded-full bg-slate-50 px-3 py-1 text-[10px] font-medium text-slate-600">
              {memberships.length} user
              {memberships.length === 1 ? "" : "s"}
            </span>
          </div>

          {memberships.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center text-[11px] text-slate-500">
              <p className="mb-1 font-medium text-slate-700">
                No users yet for this workspace.
              </p>
              <p>Use the form on the right to invite the first admin.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {memberships.map((m) => {
                const user = m.user as any;
                const invitedBy = (m.invitedBy as any) || null;
                const role = m.role || "RECRUITER";
                const status = m.status || "ACTIVE";

                const displayName =
                  user?.fullName ||
                  user?.name ||
                  user?.email?.split("@")[0] ||
                  "User";

                return (
                  <article
                    key={m.id}
                    className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-slate-100/80 p-3 text-[11px] text-slate-700 shadow-sm"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[13px] font-semibold text-slate-900">
                            {displayName}
                          </span>
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 font-mono text-[10px] text-slate-600">
                            {user?.email}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ${roleClasses(
                              role,
                            )}`}
                          >
                            {roleLabel(role)}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ${statusClasses(
                              status,
                            )}`}
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-current" />
                            {statusLabel(status)}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            Added {formatDate(m.createdAt)}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1 text-[10px] text-slate-500">
                        {invitedBy && (
                          <span>
                            Invited by{" "}
                            <span className="font-medium text-slate-700">
                              {invitedBy.fullName ||
                                invitedBy.name ||
                                invitedBy.email}
                            </span>
                          </span>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* Invite form + pending invitations */}
        <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Invite a user
              </h2>
              <p className="mt-1 text-[11px] text-slate-600">
                Send an email invite so teammates can log in with their own
                account and access this workspace.
              </p>
            </div>
          </div>

          <form
            method="POST"
            action={`/api/ats/tenants/${tenantId}/users/invite`}
            className="space-y-3 text-[13px]"
          >
            <div className="space-y-1">
              <label
                htmlFor="fullName"
                className="text-xs font-medium text-slate-700"
              >
                Full name (optional)
              </label>
              <input
                id="fullName"
                name="fullName"
                placeholder="Jane Doe"
                className="block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="email"
                className="text-xs font-medium text-slate-700"
              >
                Work email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="jane.doe@company.com"
                className="block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
              />
              <p className="text-[10px] text-slate-500">
                We&apos;ll send them a secure link to accept their invitation
                and sign in.
              </p>
            </div>

            <div className="space-y-1">
              <label
                htmlFor="role"
                className="text-xs font-medium text-slate-700"
              >
                Role on this workspace
              </label>
              <select
                id="role"
                name="role"
                defaultValue={hasOwner ? "ADMIN" : "OWNER"}
                className="block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none ring-0 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
              >
                {!hasOwner && <option value="OWNER">Owner</option>}
                <option value="ADMIN">Admin</option>
                <option value="RECRUITER">Recruiter</option>
                <option value="VIEWER">Viewer</option>
              </select>
              <p className="text-[10px] text-slate-500">
                Owners and admins can manage jobs, users and settings.
                Recruiters focus on pipelines. Viewers are read-only.
              </p>
            </div>

            <button
              type="submit"
              className="inline-flex w-full items-center justify-center rounded-full bg-[#172965] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#0f1c48]"
            >
              Send invitation
            </button>
          </form>

          {/* Pending invitations */}
          <div className="space-y-2 border-t border-slate-100 pt-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] font-medium text-slate-700">
                Pending invitations
              </p>
              <span className="rounded-full bg-slate-50 px-2.5 py-0.5 text-[10px] text-slate-500">
                {invitations.length} pending
              </span>
            </div>

            {invitations.length === 0 ? (
              <p className="text-[11px] text-slate-500">
                No outstanding invites. New invitations will show up here until
                they&apos;re accepted or expire.
              </p>
            ) : (
              <div className="space-y-1.5 text-[11px]">
                {invitations.map((inv) => (
                  <div
                    key={inv.id}
                    className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2"
                  >
                    <div className="space-y-0.5">
                      <p className="font-medium text-slate-800">
                        {inv.email}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        Role:{" "}
                        <span className="font-medium">
                          {roleLabel(inv.role)}
                        </span>{" "}
                        · Expires {formatDate(inv.expiresAt)}
                      </p>
                    </div>
                    <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-medium text-amber-700">
                      Pending
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Footer links */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4 text-[11px] text-slate-500">
        <div className="space-x-2">
          <Link
            href="/ats/tenants"
            className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 hover:text-slate-900"
          >
            ← Back to workspaces
          </Link>
        </div>
        <p>
          Changes here affect access to{" "}
          <span className="font-medium">ATS, jobs, clients and careers</span>{" "}
          for this workspace.
        </p>
      </div>
    </div>
  );
}
