// app/api/ats/tenants/owner-invite/route.ts
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { getServerUser } from "@/lib/auth/getServerUser";
import { Resend } from "resend";

export const dynamic = "force-dynamic";

const resend =
  process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.trim().length > 0
    ? new Resend(process.env.RESEND_API_KEY)
    : null;

export async function POST(req: NextRequest) {
  const user = await getServerUser();

  // 🔐 Only SUPER_ADMIN should be allowed to invite owners from this endpoint
  if (!user || user.globalRole !== "SUPER_ADMIN") {
    return NextResponse.json(
      { ok: false, error: "Forbidden: super admin only." },
      { status: 403 },
    );
  }

  const formData = await req.formData();

  const tenantId = String(formData.get("tenantId") ?? "").trim();
  const emailRaw = String(formData.get("email") ?? "").trim();
  const roleRaw = String(formData.get("role") ?? "OWNER").trim();
  const message = String(formData.get("message") ?? "").trim();

  const email = emailRaw.toLowerCase();
  const role = roleRaw.toUpperCase(); // OWNER / ADMIN / RECRUITER / VIEWER

  if (!tenantId || !email) {
    return NextResponse.redirect(
      new URL(
        `/ats/admin/tenants?error=${encodeURIComponent(
          "Workspace and owner email are required.",
        )}`,
        req.url,
      ),
    );
  }

  try {
    // 1) Ensure tenant exists
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      return NextResponse.redirect(
        new URL(
          `/ats/admin/tenants?error=${encodeURIComponent(
            "Workspace not found.",
          )}`,
          req.url,
        ),
      );
    }

    // 2) Find or create the user record backing this email
    let userRecord =
      (await prisma.user.findUnique({
        where: { email },
      })) ?? null;

    if (!userRecord) {
      userRecord = await prisma.user.create({
        data: {
          email,
          fullName: null,
          globalRole: "USER", // SUPER_ADMIN remains manual
        },
      });
    }

    // 3) Generate invite token + hash
    const rawToken = crypto.randomUUID().replace(/-/g, "");
    const tokenHash = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // 4) Create TenantInvitation row
    await prisma.tenantInvitation.create({
      data: {
        tenantId,
        userId: userRecord.id,
        email,
        role: role.toLowerCase(), // stored consistently (e.g. "owner", "admin")
        tokenHash,
        expiresAt,
      },
    });

    // 5) Build accept URL
    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      new URL("/", req.url).origin ||
      "https://www.thinkats.com";

    // You can later have /accept-invite or similar consume token + tenantId
    const acceptUrl = `${baseUrl}/signup?token=${encodeURIComponent(
      rawToken,
    )}&tenantId=${encodeURIComponent(tenantId)}`;

    // 6) Send email via Resend (if configured)
    if (resend) {
      const subject = `You're invited to ThinkATS workspace: ${
        tenant.name ?? tenant.slug ?? "Workspace"
      }`;

      const html = buildInvitationHtml({
        tenantName: tenant.name ?? tenant.slug ?? "your new ATS workspace",
        acceptUrl,
        message,
      });

      await resend.emails.send({
        from:
          process.env.THINKATS_FROM_EMAIL ||
          "ThinkATS <no-reply@thinkats.com>",
        to: [email],
        subject,
        html,
      });
    } else {
      console.warn(
        "[owner-invite] RESEND_API_KEY not set – skipping email send.",
      );
    }

    return NextResponse.redirect(
      new URL("/ats/admin/tenants?invited=1", req.url),
    );
  } catch (error) {
    console.error("[owner-invite] error sending owner invite", error);
    return NextResponse.redirect(
      new URL(
        `/ats/admin/tenants?error=${encodeURIComponent(
          "Failed to send owner invite. Check logs for details.",
        )}`,
        req.url,
      ),
    );
  }
}

function buildInvitationHtml(opts: {
  tenantName: string;
  acceptUrl: string;
  message?: string;
}) {
  const { tenantName, acceptUrl, message } = opts;

  const safeTenant =
    tenantName && tenantName.trim().length > 0
      ? tenantName.trim()
      : "your new ATS workspace";

  const extra = message
    ? `
      <p style="font-size:13px;line-height:1.5;margin:16px 0;color:#0f172a;">
        Personal note from your contact:
      </p>
      <blockquote style="margin:0;padding:12px 16px;border-left:3px solid #e5e7eb;background:#f9fafb;font-size:13px;color:#374151;">
        ${escapeHtml(message)}
      </blockquote>
    `
    : "";

  return `
  <div style="font-family:-apple-system,BlinkMacSystemFont,system-ui,Segoe UI,sans-serif;font-size:14px;color:#0f172a;line-height:1.6;">
    <p style="margin:0 0 16px;">Hi,</p>
    <p style="margin:0 0 16px;">
      You’ve been invited to join the <strong>${safeTenant}</strong> workspace on <strong>ThinkATS</strong>.
    </p>
    ${extra}
    <p style="margin:16px 0;">
      <a href="${acceptUrl}" style="display:inline-block;padding:10px 18px;border-radius:999px;background:#111827;color:#ffffff;text-decoration:none;font-weight:600;font-size:13px;">
        Accept invitation
      </a>
    </p>
    <p style="margin:16px 0 0;font-size:12px;color:#6b7280;">
      If the button doesn’t work, copy and paste this link into your browser:
      <br />
      <span style="word-break:break-all;color:#4b5563;">${acceptUrl}</span>
    </p>
  </div>
  `;
}

function escapeHtml(input: string) {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
