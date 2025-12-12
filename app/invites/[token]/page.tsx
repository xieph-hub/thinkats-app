// app/invites/[token]/page.tsx
import crypto from "crypto";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

// Handles weird cases like:
// /invites/https://www.thinkats.com/invites/<token>
function normaliseToken(raw: string) {
  const decoded = decodeURIComponent(String(raw || "")).trim();

  // If raw is a full URL, extract the last path segment
  if (decoded.startsWith("http://") || decoded.startsWith("https://")) {
    try {
      const u = new URL(decoded);
      const parts = u.pathname.split("/").filter(Boolean);
      return parts[parts.length - 1] || raw;
    } catch {
      // fall through
    }
  }

  // If it contains ".../invites/..."
  const marker = "/invites/";
  const idx = decoded.lastIndexOf(marker);
  if (idx !== -1) return decoded.slice(idx + marker.length);

  // If it contains "invites/" without leading slash
  if (decoded.includes("invites/")) return decoded.split("invites/").pop() || decoded;

  return decoded;
}

export default async function InviteTokenPage({ params }: { params: { token: string } }) {
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
          <h1 className="mt-2 text-lg font-semibold text-slate-900">Invitation not available</h1>
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

  // Minimal, safe next step: send them to login with the token in the URL.
  // After login, you can build "accept invite" to attach them to the tenant.
  const continueUrl = `/login?invite=${encodeURIComponent(token)}`;

  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          ThinkATS · Invitation
        </p>
        <h1 className="mt-2 text-lg font-semibold text-slate-900">You’ve been invited</h1>

        <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
          <div className="flex justify-between gap-3">
            <span className="text-slate-500">Workspace</span>
            <span className="font-semibold text-slate-900">{invite.tenant?.name}</span>
          </div>
          <div className="mt-2 flex justify-between gap-3">
            <span className="text-slate-500">Role</span>
            <span className="font-semibold text-slate-900">{invite.role}</span>
          </div>
          <div className="mt-2 flex justify-between gap-3">
            <span className="text-slate-500">Email</span>
            <span className="font-semibold text-slate-900">{invite.email}</span>
          </div>
        </div>

        <p className="mt-3 text-sm text-slate-600">
          Continue to sign in (or create an account) to accept this invitation.
        </p>

        <div className="mt-4">
          <Link
            href={continueUrl}
            className="inline-flex w-full items-center justify-center rounded-full bg-[#172965] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0f1c48]"
          >
            Continue
          </Link>
        </div>

        <p className="mt-3 text-[11px] text-slate-500">
          Security note: This link is single-use and expires automatically.
        </p>
      </div>
    </div>
  );
}
