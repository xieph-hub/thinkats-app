// app/ats/tenants/[tenantId]/invite-admin/page.tsx

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ensureOtpVerified } from "@/lib/requireOtp";
import InviteAdminForm from "./InviteAdminForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Invite workspace admin | ThinkATS",
  description:
    "Invite a client or internal stakeholder to manage a ThinkATS tenant workspace.",
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
  await ensureOtpVerified("/ats/tenants");

  const tenantId = params.tenantId;

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
  });

  if (!tenant) {
    notFound();
  }

  const label = tenant.name || tenant.slug || "Workspace";
  const invited = searchParams?.invited === "1";
  const errorCode = searchParams?.error;

  let errorMessage: string | null = null;
  if (errorCode === "not_authorised") {
    errorMessage = "You are not authorised to invite admins for this workspace.";
  } else if (errorCode === "invalid_email") {
    errorMessage = "Please provide a valid email address.";
  } else if (errorCode === "invite_failed") {
    errorMessage =
      "Something went wrong while sending the invite. Please try again.";
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 lg:px-8 space-y-4">
      {/* Breadcrumbs */}
      <nav className="mb-2 text-[11px] text-slate-500">
        <Link
          href="/ats"
          className="hover:text-slate-700 hover:underline underline-offset-2"
        >
          ATS
        </Link>
        <span className="mx-1">/</span>
        <Link
          href="/ats/tenants"
          className="hover:text-slate-700 hover:underline underline-offset-2"
        >
          Workspaces
        </Link>
        <span className="mx-1">/</span>
        <span className="text-slate-700">Invite admin</span>
      </nav>

      {/* Top header card */}
      <section className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-[11px] text-slate-600">
        <p className="text-xs font-semibold text-slate-900">
          Invite an admin to this workspace
        </p>
        <p className="mt-1">
          Workspace:{" "}
          <span className="font-medium text-[#172965]">{label}</span>
        </p>
        <p className="mt-1 text-[10px] text-slate-500">
          The person you invite will receive a secure email with a link to log
          into ThinkATS as an admin for this tenant only.
        </p>
      </section>

      {/* Alerts */}
      {invited && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] text-emerald-800">
          Admin invite sent successfully.
        </div>
      )}
      {errorMessage && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-700">
          {errorMessage}
        </div>
      )}

      {/* Form */}
      <InviteAdminForm
        tenantId={tenant.id}
        tenantName={label}
        defaultEmail={tenant.primaryContactEmail ?? ""}
      />
    </div>
  );
}
