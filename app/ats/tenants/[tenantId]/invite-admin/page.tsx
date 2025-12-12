// app/ats/tenants/[tenantId]/invite-admin/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Invite admin | ThinkATS",
  description: "Invite additional admins or recruiters to this ATS workspace.",
};

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    v,
  );
}

type PageProps = {
  params: { tenantId: string }; // can be UUID OR slug
  searchParams?: { invited?: string; error?: string };
};

function humanError(code?: string) {
  switch (code) {
    case "unauthenticated":
      return "You need to sign in to send invitations.";
    case "forbidden":
      return "You don’t have permission to invite admins for this workspace.";
    case "tenant_not_found":
      return "Workspace not found.";
    case "missing_email":
      return "Email is required to send an invitation.";
    case "invalid_email":
      return "Please enter a valid email address.";
    case "email_failed":
      return "Invite was created, but email delivery failed. Try again or copy the invite link from the JSON endpoint.";
    case "server_error":
      return "Something went wrong. Please try again.";
    default:
      return null;
  }
}

export default async function InviteAdminPage({ params, searchParams }: PageProps) {
  const tenantParam = String(params.tenantId || "").trim();

  const tenant = isUuid(tenantParam)
    ? await prisma.tenant.findUnique({
        where: { id: tenantParam },
        select: { id: true, name: true, slug: true },
      })
    : await prisma.tenant.findUnique({
        where: { slug: tenantParam },
        select: { id: true, name: true, slug: true },
      });

  if (!tenant) notFound();

  const invited = searchParams?.invited === "1";
  const errorMessage = humanError(searchParams?.error);

  const label = tenant.name || tenant.slug || "Workspace";

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            ATS · Workspaces
          </p>
          <h1 className="mt-1 text-xl font-semibold text-slate-900">
            Invite admin for {label}
          </h1>
          <p className="mt-1 text-xs text-slate-600">
            Send a secure, single-use invitation link so colleagues can access this workspace.
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
          Invitation sent. If they don’t see it in a few minutes, ask them to check Spam/Junk.
        </div>
      )}

      {errorMessage && (
        <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-700">
          {errorMessage}
        </div>
      )}

      <form
        method="POST"
        action={`/api/ats/tenants/${encodeURIComponent(tenantParam)}/invite-admin`}
        className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 text-[13px] shadow-sm"
      >
        <div className="space-y-1">
          <label htmlFor="email" className="text-xs font-medium text-slate-700">
            Admin email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            placeholder="person@company.com"
            className="block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none placeholder:text-slate-400 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
          />
          <p className="mt-1 text-[10px] text-slate-500">
            We’ll send a one-time link. It expires automatically.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label htmlFor="fullName" className="text-xs font-medium text-slate-700">
              Name (optional)
            </label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              placeholder="e.g. Ada"
              className="block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none placeholder:text-slate-400 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="role" className="text-xs font-medium text-slate-700">
              Role in this workspace
            </label>
            <select
              id="role"
              name="role"
              defaultValue="admin"
              className="block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
            >
              <option value="owner">Owner</option>
              <option value="admin">Admin</option>
              <option value="recruiter">Recruiter</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>
        </div>

        <div className="space-y-1">
          <label htmlFor="message" className="text-xs font-medium text-slate-700">
            Personal note (optional)
          </label>
          <textarea
            id="message"
            name="message"
            rows={3}
            placeholder="Add context for the recipient (optional)."
            className="block w-full resize-none rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none placeholder:text-slate-400 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
          />
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
