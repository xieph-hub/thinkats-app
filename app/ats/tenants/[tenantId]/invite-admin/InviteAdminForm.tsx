// app/ats/tenants/[tenantId]/invite-admin/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ensureOtpVerified } from "@/lib/requireOtp";
import InviteAdminForm from "./InviteAdminForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Invite workspace admin | ThinkATS",
  description:
    "Invite admins, owners or recruiters into this ATS workspace.",
};

type PageProps = {
  params: { tenantId: string };
};

export default async function InviteAdminPage({ params }: PageProps) {
  const { tenantId } = params;

  // Guard with OTP like the rest of ATS
  await ensureOtpVerified(`/ats/tenants/${tenantId}/invite-admin`);

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      id: true,
      name: true,
      slug: true,
      primaryContactEmail: true,
      status: true,
    },
  });

  if (!tenant) {
    notFound();
  }

  const label = tenant.name || tenant.slug || "Workspace";

  return (
    <div className="mx-auto max-w-xl px-4 py-8 lg:px-0">
      <header className="mb-6 space-y-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
          ATS · Workspace access
        </p>
        <h1 className="text-2xl font-semibold text-slate-900">
          Invite an admin to {label}
        </h1>
        <p className="text-xs text-slate-600">
          Send a login invite to a founder, HR lead or hiring manager. They’ll
          sign in via <code>/login</code> with their email and your OTP flow.
        </p>
      </header>

      <InviteAdminForm
        tenantId={tenant.id}
        tenantName={label}
        defaultEmail={tenant.primaryContactEmail ?? ""}
      />
    </div>
  );
}
