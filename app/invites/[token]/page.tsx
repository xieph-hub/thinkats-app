// app/invites/[token]/page.tsx
import crypto from "crypto";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import InviteAcceptForm from "./InviteAcceptForm";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    v,
  );
}

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export default async function InviteTokenPage({
  params,
}: {
  params: { token: string };
}) {
  const token = String(params.token || "").trim();

  if (!isUuid(token)) notFound();

  const tokenHash = hashToken(token);

  const invite = await prisma.tenantInvitation.findFirst({
    where: { tokenHash },
    select: {
      id: true,
      email: true,
      role: true,
      expiresAt: true,
      usedAt: true,
      tenant: { select: { id: true, name: true, slug: true } },
    },
  });

  if (!invite) notFound();

  const now = new Date();
  const isExpired = invite.expiresAt <= now;
  const isUsed = !!invite.usedAt;

  const existingUser = await prisma.user.findUnique({
    where: { email: invite.email },
    select: { id: true, email: true },
  });

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <div className="mb-6 space-y-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          ThinkATS · Workspace Invitation
        </p>
        <h1 className="text-xl font-semibold text-slate-900">
          Join <span className="text-[#172965]">{invite.tenant.name}</span>
        </h1>
        <p className="text-xs text-slate-600">
          This invitation grants <span className="font-semibold">{invite.role}</span>{" "}
          access to the workspace.
        </p>
      </div>

      <InviteAcceptForm
        token={token}
        email={invite.email}
        tenantName={invite.tenant.name}
        role={invite.role}
        isExpired={isExpired}
        isUsed={isUsed}
        accountExists={!!existingUser}
      />
    </div>
  );
}
