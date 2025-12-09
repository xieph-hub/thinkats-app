// app/api/ats/tenants/[tenantId]/invite-admin/route.ts
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import { getServerUser } from "@/lib/auth/getServerUser";

export const runtime = "nodejs";

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * POST /api/ats/tenants/:tenantId/invite-admin
 *
 * Body: { email: string, role?: string }
 *
 * Rules:
 * - Must be logged in
 * - Must be SUPER_ADMIN (cross-tenant workspace admin)
 * - Invitation is always scoped to params.tenantId (not primaryTenantId)
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { tenantId: string } },
) {
  try {
    const ctx = await getServerUser();

    if (!ctx || !ctx.user) {
      return NextResponse.json(
        { ok: false, error: "unauthenticated" },
        { status: 401 },
      );
    }

    const { isSuperAdmin } = ctx;
    if (!isSuperAdmin) {
      // Only the ThinkATS super admin can manage workspaces + invites
      return NextResponse.json(
        { ok: false, error: "forbidden" },
        { status: 403 },
      );
    }

    const tenantId = params.tenantId;

    if (!tenantId) {
      return NextResponse.json(
        { ok: false, error: "missing_tenant_id" },
        { status: 400 },
      );
    }

    // Make sure the tenant exists
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      return NextResponse.json(
        { ok: false, error: "tenant_not_found" },
        { status: 404 },
      );
    }

    const body = await req.json().catch(() => null);
    const emailRaw = body?.email as string | undefined;
    const roleRaw = (body?.role as string | undefined) ?? "admin";

    if (!emailRaw) {
      return NextResponse.json(
        { ok: false, error: "missing_email" },
        { status: 400 },
      );
    }

    const email = emailRaw.trim().toLowerCase();
    if (!email) {
      return NextResponse.json(
        { ok: false, error: "missing_email" },
        { status: 400 },
      );
    }

    const role = roleRaw.trim() || "admin";

    // Generate invite token and hash for DB
    const tokenPlain = crypto.randomUUID();
    const tokenHash = crypto
      .createHash("sha256")
      .update(tokenPlain)
      .digest("hex");

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Store invitation tied to this tenant + email
    await prisma.tenantInvitation.create({
      data: {
        tenantId,
        email,
        role,
        tokenHash,
        expiresAt,
        usedAt: null,
      },
    });

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL || "https://www.thinkats.com";
    const baseUrl = siteUrl.replace(/\/$/, "");

    const acceptUrl = `${baseUrl}/accept-invite?tenantId=${encodeURIComponent(
      tenantId,
    )}&token=${encodeURIComponent(tokenPlain)}`;

    // Fire-and-forget email; if it fails, we still return ok:true
    try {
      if (process.env.RESEND_API_KEY) {
        await resend.emails.send({
          from: "ThinkATS <no-reply@thinkats.com>",
          to: email,
          subject: `You've been invited to ${tenant.name || "a ThinkATS workspace"}`,
          html: `
            <p>Hello,</p>
            <p>You’ve been invited to join the <strong>${
              tenant.name || tenant.slug || "ThinkATS workspace"
            }</strong> workspace on ThinkATS as <strong>${role}</strong>.</p>
            <p>Click the button below to accept this invitation:</p>
            <p>
              <a href="${acceptUrl}" style="
                display: inline-block;
                padding: 10px 16px;
                border-radius: 999px;
                background-color: #172965;
                color: #ffffff;
                text-decoration: none;
                font-weight: 600;
                font-size: 14px;
              ">
                Accept invitation
              </a>
            </p>
            <p>If the button doesn’t work, copy and paste this URL into your browser:</p>
            <p><a href="${acceptUrl}">${acceptUrl}</a></p>
            <p>This link will expire in 7 days.</p>
          `,
        });
      } else {
        console.warn(
          "[invite-admin] RESEND_API_KEY is not set – email not sent",
        );
      }
    } catch (emailErr) {
      console.error("[invite-admin] Failed to send email", emailErr);
      // Still return ok: true to keep UX simple
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[invite-admin] Unexpected error", err);
    return NextResponse.json(
      { ok: false, error: "server_error" },
      { status: 500 },
    );
  }
}
