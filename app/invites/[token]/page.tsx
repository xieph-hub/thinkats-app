// app/invites/[token]/page.tsx
import crypto from "crypto";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

// Handles the weird case where the token accidentally contains a full URL
function normaliseToken(raw: string) {
  const decoded = decodeURIComponent(raw || "").trim();

  // If it looks like a URL, extract last path segment
  if (decoded.startsWith("http://") || decoded.startsWith("https://")) {
    try {
      const u = new URL(decoded);
      const parts = u.pathname.split("/").filter(Boolean);
      return parts[parts.length - 1] || decoded;
    } catch {
      return decoded;
    }
  }

  // If it contains "/invites/", take what comes after
  const idx = decoded.lastIndexOf("/invites/");
  if (idx >= 0) return decoded.slice(idx + "/invites/".length);

  // Otherwise assume it’s already a token
  return decoded;
}

export default async function InviteAcceptPage({
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
    include: {
      tenant: { select: { name: true, slug: true } },
    },
  });

  if (!invite) {
    return (
      <div className="mx-auto max-w-xl px-6 py-16">
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="text-sm font-semibold text-slate-900">Invitation not found</div>
          <div className="mt-1 text-sm text-slate-600">
            This link may be expired or already used.
          </div>
          <div className="mt-5">
            <Link href="/" className="text-sm font-semibold text-[#172965]">
              Go to ThinkATS →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const loginUrl = `/login?email=${encodeURIComponent(invite.email)}&invite=1`;

  return (
    <div className="mx-auto max-w-xl px-6 py-16">
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          ThinkATS · Workspace invite
        </div>

        <h1 className="mt-2 text-lg font-semibold text-slate-900">
          You’ve been invited to <span className="text-[#172965]">{invite.tenant.name}</span>
        </h1>

        <p className="mt-2 text-sm text-slate-600">
          Sign in with <span className="font-semibold text-slate-900">{invite.email}</span> to complete access.
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          <Link
            href={loginUrl}
            className="inline-flex items-center rounded-full bg-[#172965] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0f1c48]"
          >
            Continue to sign in
          </Link>

          <a
            href={`mailto:${process.env.SUPPORT_EMAIL || "support@thinkats.com"}`}
            className="inline-flex items-center rounded-full bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            Contact support
          </a>
        </div>

        <p className="mt-4 text-xs text-slate-500">
          If you weren’t expecting this invitation, you can safely ignore it.
        </p>
      </div>
    </div>
  );
}
