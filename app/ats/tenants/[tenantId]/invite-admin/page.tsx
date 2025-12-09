// app/ats/tenants/[tenantId]/invite-admin/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Invite admin | ThinkATS",
  description:
    "Invite additional admins or recruiters to this ATS workspace.",
};

type PageProps = {
  params: { tenantId: string };
  searchParams?: {
    invited?: string;
    error?: string;
  };
};

export default async function InviteAdminPage({
  params,
  searchParams,
}: PageProps) {
  const tenantId = params.tenantId;

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      id: true,
      name: true,
      slug: true,
    },
  });

  if (!tenant) {
    notFound();
  }

  const invited = searchParams?.invited === "1";
  const errorCode = searchParams?.error;

  let errorMessage: string | null = null;
  if (errorCode === "missing_email") {
    errorMessage = "Email is required to send an invitation.";
  } else if (errorCode === "server_error") {
    errorMessage =
      "Something went wrong while sending the invitation. Please try again.";
  }

  const label = tenant.name || tenant.slug || "Workspace";

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            ATS · Workspaces
          </p>
          <h1 className="mt-1 text-xl font-semibold text-slate-900">
            Invite admin for {label}
          </h1>
          <p className="mt-1 text-xs text-slate-600">
            Send a secure invite so colleagues can access this workspace as
            admins, recruiters or viewers.
          </p>
        </div>

        <Link
          href="/ats/tenants"
          className="rounded-full bg-slate-50 px-3 py-1 text-[10px] font-medium text-slate-700 hover:bg-slate-100"
        >
          ← Back to workspaces
        </Link>
      </div>

      {invited && (
        <div className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] text-emerald-800">
          Invitation sent. If the user doesn&apos;t see it in a few minutes,
          ask them to check their spam folder.
        </div>
      )}

      {errorMessage && (
        <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-700">
          {errorMessage}
        </div>
      )}

      <form
        method="POST"
        action={`/api/ats/tenants/${encodeURIComponent(
          tenantId,
        )}/invite-admin`}
        className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 text-[13px] shadow-sm"
      >
        <div className="space-y-1">
          <label
            htmlFor="email"
            className="text-xs font-medium text-slate-700"
          >
            Admin email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            placeholder="person@company.com"
            className="block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
          />
          <p className="mt-1 text-[10px] text-slate-500">
            We&apos;ll send a one-time link so they can accept the invitation
            and set up access.
          </p>
        </div>

        <div className="space-y-1">
          <label
            htmlFor="role"
            className="text-xs font-medium text-slate-700"
          >
            Role in this workspace
          </label>
          <select
            id="role"
            name="role"
            defaultValue="admin"
            className="block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none ring-0 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
          >
            <option value="owner">Owner</option>
            <option value="admin">Admin</option>
            <option value="recruiter">Recruiter</option>
            <option value="viewer">Viewer</option>
          </select>
          <p className="mt-1 text-[10px] text-slate-500">
            Owners and admins can manage jobs and settings. Recruiters focus on
            pipeline. Viewers have read-only access.
          </p>
        </div>

        <button
          type="submit"
          className="inline-flex w-full items-center justify-center rounded-full bg-[#172965] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#0f1c48]"
        >
          Send invitation
        </button>
      </form>
    </div>
  );
}
