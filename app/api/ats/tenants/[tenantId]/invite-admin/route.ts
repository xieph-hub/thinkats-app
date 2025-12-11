// app/api/ats/tenants/[tenantId]/invite-admin/route.ts
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";
import { getServerUser } from "@/lib/auth/getServerUser";

export const dynamic = "force-dynamic";

const resend = new Resend(process.env.RESEND_API_KEY);
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.thinkats.com";

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function POST(
  req: NextRequest,
  { params }: { params: { tenantId: string } },
) {
  const tenantId = params.tenantId;

  try {
    // 1) Auth guard (super admin / tenant admin)
    const ctx = await getServerUser();

    if (!ctx || !ctx.user || !ctx.user.email) {
      return NextResponse.json(
        { ok: false, error: "unauthenticated" },
        { status: 401 },
      );
    }

    const { isSuperAdmin, tenantRoles } = ctx;

    const thisTenantRole = tenantRoles.find(
      (r: any) => r.tenantId === tenantId,
    );
    const isTenantAdmin =
      thisTenantRole &&
      ["owner", "admin"].includes((thisTenantRole as any).role);

    if (!isSuperAdmin && !isTenantAdmin) {
      return NextResponse.json(
        { ok: false, error: "forbidden" },
        { status: 403 },
      );
    }

    // 2) Parse HTML form data (THIS is the key change)
    const formData = await req.formData();

    const rawEmail = (formData.get("email") || "").toString().trim();
    const role = (formData.get("role") || "admin").toString().trim();
    const fullName = (formData.get("fullName") || "").toString().trim();
    const message = (formData.get("message") || "").toString().trim();

    if (!rawEmail) {
      const redirectUrl = new URL(
        `/ats/tenants/${tenantId}/invite-admin?error=missing_email`,
        req.nextUrl,
      );
      return NextResponse.redirect(redirectUrl);
    }

    const email = rawEmail.toLowerCase();

    // Basic email sanity check
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      const redirectUrl = new URL(
        `/ats/tenants/${tenantId}/invite-admin?error=invalid_email`,
        req.nextUrl,
      );
      return NextResponse.redirect(redirectUrl);
    }

    // 3) Check tenant exists
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      const redirectUrl = new URL(
        `/ats/tenants/${tenantId}/invite-admin?error=tenant_not_found`,
        req.nextUrl,
      );
      return NextResponse.redirect(redirectUrl);
    }

    // 4) Create invitation row
    const token = crypto.randomUUID();
    const tokenHash = hashToken(token);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.tenantInvitation.create({
      data: {
        tenantId: tenant.id,
        email,
        role,
        tokenHash,
        expiresAt,
        // Uncomment if your schema has these:
        // invitedByUserId: ctx.user.id,
        // inviteeName: fullName || null,
        // inviteMessage: message || null,
      },
    });

    // 5) Send invite email via Resend
    const inviteUrl = `${
      siteUrl.replace(/\/$/, "")
    }/invites/${token}`;

    const safeFullName = fullName || "there";

    const html = `
      <p>Hi ${safeFullName},</p>
      <p>You’ve been invited to join the <strong>${tenant.name}</strong> workspace on ThinkATS.</p>
      <p><a href="${inviteUrl}">Click here to accept your invitation</a>.</p>
      ${
        message
          ? `<p style="margin-top:16px;"><em>Personal note from the inviter:</em><br/>${message}</p>`
          : ""
      }
      <p>This link expires in 7 days.</p>
    `;

    await resend.emails.send({
      from: "ThinkATS <no-reply@thinkats.com>",
      to: email,
      subject: `You’ve been invited to ThinkATS (${tenant.name})`,
      html,
    });

    // 6) Redirect back with success flag for your page banner
    const redirectUrl = new URL(
      `/ats/tenants/${tenantId}/invite-admin?invited=1`,
      req.nextUrl,
    );
    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error(
      `/api/ats/tenants/${tenantId}/invite-admin POST error`,
      error,
    );
    const redirectUrl = new URL(
      `/ats/tenants/${tenantId}/invite-admin?error=server_error`,
      req.nextUrl,
    );
    return NextResponse.redirect(redirectUrl);
  }
}
