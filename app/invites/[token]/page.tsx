// app/invites/[token]/page.tsx
import crypto from "crypto";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import InviteAcceptClient from "./InviteAcceptClient";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function normaliseToken(raw: string) {
  const decoded = decodeURIComponent(String(raw || "")).trim();

  // If raw is a full URL, extract the last path segment
  if (decoded.startsWith("http://") || decoded.startsWith("https://")) {
    try {
      const u = new URL(decoded);
      const parts = u.pathname.split("/").filter(Boolean);
      return parts[parts.length - 1] || decoded;
    } catch {
      // fall through
    }
  }

  // If it contains ".../invites/..."
  const marker = "/invites/";
  const idx = decoded.lastIndexOf(marker);
  if (idx !== -1) return decoded.slice(idx + marker.length);

  if (decoded.includes("invites/")) return decoded.split("invites/").pop() || decoded;

  return decoded;
}

export default async function InviteTokenPage({
  params,
}: {
  params: { token: string };
}) {
  const token = normaliseToken(params.token);
  const tokenHash = hashToken(token);

  const invite = await prisma.tenantInvitation.findFirst({
    where: {
      tokenHash,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    select: {
      email: true,
      role: true,
      expiresAt: true,
      tenantId: true,
      tenant: { select: { name: true, slug: true } },
    },
  });

  if (!invite) {
    return (
      <div className="mx-auto max-w-lg px-4 py-12">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            ThinkATS · Invitation
          </p>
          <h1 className="mt-2 text-lg font-semibold text-slate-900">
            Invitation not available
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            This invitation link is invalid, expired, or already used.
          </p>
          <div className="mt-4">
            <Link
              href="/"
              className="inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white"
            >
              Go to ThinkATS
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // If the invited email already has a password, don’t let invites become a reset mechanism.
  const existingUser = await prisma.user.findUnique({
    where: { email: invite.email },
    select: { id: true, passwordHash: true, fullName: true },
  });

  const mode: "create" | "signin" =
    existingUser?.passwordHash ? "signin" : "create";

  return (
    <InviteAcceptClient
      token={token}
      tenantName={invite.tenant?.name || invite.tenant?.slug || "Workspace"}
      invitedEmail={invite.email}
      role={invite.role}
      expiresAt={invite.expiresAt.toISOString()}
      mode={mode}
    />
  );
}
