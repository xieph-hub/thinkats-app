// app/ats/tenants/[tenantId]/users/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ensureOtpVerified } from "@/lib/requireOtp";
import InviteUserForm from "./InviteUserForm";
import PendingInvitesTable from "./PendingInvitesTable";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Workspace users | ThinkATS",
  description:
    "Manage who has access to this ATS workspace and see pending invitations.",
};

type PageProps = {
  params: { tenantId: string };
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

function roleLabel(raw: string | null | undefined): string {
  if (!raw) return "Member";
  const r = raw.toLowerCase();
  if (r === "owner") return "Owner";
  if (r === "admin") return "Admin";
  if (r === "recruiter") return "Recruiter";
  if (r === "hiring_manager") return "Hiring manager";
  return r.charAt(0).toUpperCase() + r.slice(1);
}

function roleBadgeClasses(raw: string | null | undefined): string {
  if (!raw) return "bg-slate-50 text-slate-700 ring-slate-200";
  const r = raw.toLowerCase();
  switch (r) {
    case "owner":
      return "bg-[#172965]/10 text-[#172965] ring-[#172965]/20";
    case "admin":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";
    case "recruiter":
      return "bg-[#FFC000]/10 text-[#8a6400] ring-[#FFC000]/30";
    case "hiring_manager":
      return "bg-sky-50 text-sky-700 ring-sky-200";
    default:
      return "bg-slate-50 text-slate-700 ring-slate-200";
  }
}

export default async function TenantUsersPage({ params }: PageProps) {
  const tenantId = params.tenantId;

  // OTP gate like other ATS admin pages
  await ensureOtpVerified(`/ats/tenants/${tenantId}/users`);

  // Load tenant
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
      createdAt: true,
    },
  });

  if (!tenant) {
    notFound();
  }

  // Workspace members + invitations
  const [memberships, invitations] = await Promise.all([
    prisma.userTenantRole.findMany({
      where: { tenantId },
      include: {
        user: true,
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.tenantInvitation.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const totalMembers = memberships.length;
  const ownersCount = memberships.filter((m) => m.role === "owner").length;
  const adminCount = memberships.filter((m) => m.role === "admin").length;
  const pendingInvites = invitations.filter((inv) => !inv.usedAt).length;

  const serializedInvites = invitations.map((inv) => ({
    id: inv.id,
    email: inv.email,
    role: inv.role,
    createdAt: inv.createdAt.toISOString(),
    expiresAt: inv.expiresAt ? inv.expiresAt.toISOString() : null,
    usedAt: inv.usedAt ? inv.usedAt.toISOString() : null,
    tokenHash: inv.tokenHash,
  }));

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 lg:px-0">
      {/* Header */}
      <header className="space-y-1 border-b border-slate-200 pb-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          ATS · Workspace users
        </p>
        <h1 className="text-2xl font-semibold text-slate-900">
          Users for {tenant.name || "Workspace"}
        </h1>
        <p className="text-xs text-slate-600">
          See who can access this ATS workspace, their roles and any pending
          invitations.
        </p>
      </header>

      {/* Invite teammate form */}
      <section>
        <InviteUserForm tenantId={tenant.id} />
      </section>

      {/* Top stats row */}
      <section className="grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-xs shadow-sm">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
            Total members
          </p>
          <p className="mt-2 text-2xl font-semibold text-[#172965]">
            {totalMembers}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">
            Owners: {ownersCount} · Admins: {adminCount}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-xs shadow-sm">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
            Pending invitations
          </p>
          <p className="mt-2 text-2xl font-semibold text-[#306B34]">
            {pendingInvites}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">
            Invites that haven&apos;t been accepted yet.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-xs shadow-sm">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
            Workspace
          </p>
          <p className="mt-2 text-sm font-semibold text-slate-900">
            {tenant.name}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">
            Slug:{" "}
            <code className="rounded bg-slate-50 px-1 py-0.5">
              {tenant.slug}
            </code>
          </p>
          <p className="mt-1 text-[11px] text-slate-500">
            Created {formatDate(tenant.createdAt)}
          </p>
        </div>
      </section>

      {/* Members list */}
      <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Current members
            </h2>
            <p className="text-[11px] text-slate-500">
              People who can sign in to this workspace.
            </p>
          </div>
          <span className="inline-flex items-center rounded-full bg-slate-50 px-3 py-1 text-[10px] font-medium text-slate-600">
            {totalMembers} members • {ownersCount} owners • {adminCount} admins
          </span>
        </div>

        {memberships.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center text-[11px] text-slate-500">
            <p className="mb-1 font-medium text-slate-700">
              No members yet for this workspace.
            </p>
            <p>
              Once you invite team members, they&apos;ll appear here with their
              roles and access level.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {memberships.map((membership) => {
              const user = membership.user as any;
              const initials =
                (user?.fullName || user?.email || "?")
                  .split(" ")
                  .map((part: string) => part.charAt(0).toUpperCase())
                  .slice(0, 2)
                  .join("") || "?";

              return (
                <div
                  key={membership.id}
                  className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-[11px] font-semibold uppercase text-white">
                      {initials}
                    </div>
                    <div className="space-y-0.5 text-xs">
                      <p className="font-semibold text-slate-900">
                        {user?.fullName || user?.email || "Unknown user"}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {user?.email}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Added {formatDate(membership.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-[11px]">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-medium ring-1 ${roleBadgeClasses(
                        membership.role,
                      )}`}
                    >
                      {roleLabel(membership.role)}
                      {membership.isPrimary && (
                        <span className="ml-1 rounded-full bg-white/70 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide">
                          Primary
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Pending invitations (with copy + resend) */}
      <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Pending invitations
            </h2>
            <p className="text-[11px] text-slate-500">
              People you&apos;ve invited to this workspace who haven&apos;t
              completed login yet.
            </p>
          </div>
          <span className="inline-flex items-center rounded-full bg-slate-50 px-3 py-1 text-[10px] font-medium text-slate-600">
            {pendingInvites} pending invite
            {pendingInvites === 1 ? "" : "s"}
          </span>
        </div>

        <PendingInvitesTable
          tenantId={tenant.id}
          invites={serializedInvites}
        />
      </section>

      {/* Back link */}
      <div className="pt-2 text-[11px]">
        <Link
          href="/ats/tenants"
          className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-800"
        >
          <span className="text-xs">←</span>
          Back to workspaces
        </Link>
      </div>
    </div>
  );
}
