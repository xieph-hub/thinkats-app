// app/api/ats/tenants/[tenantId]/invite-admin/route.ts
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import { getServerUser } from "@/lib/auth/getServerUser";

export const runtime = "nodejs";

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Derive the base app URL for invite links, e.g. https://www.thinkats.com
 */
function getBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (envUrl) return envUrl.replace(/\/$/, "");
  return "https://www.thinkats.com";
}

function hashToken(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

export async function POST(
  req: NextRequest,
  { params }: { params: { tenantId: string } },
) {
  const { tenantId } = params;

  // 1) Auth – must be logged in
  const currentUser = await getServerUser();
  if (!currentUser) {
    return NextResponse.json(
      { ok: false, error: "unauthenticated" },
      { status: 401 },
    );
  }

  // 2) Tenant must exist
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
  });

  if (!tenant) {
    return NextResponse.json(
      { ok: false, error: "tenant_not_found" },
      { status: 404 },
    );
  }

  // 3) Authorisation – SUPER_ADMIN or member of this tenant
  const isSuperAdmin =
    (currentUser as any).globalRole &&
    String((currentUser as any).globalRole).toUpperCase() === "SUPER_ADMIN";

  const membership = await prisma.userTenantRole.findFirst({
    where: {
      userId: currentUser.id,
      tenantId,
    },
  });

  if (!isSuperAdmin && !membership) {
    return NextResponse.json(
      { ok: false, error: "forbidden" },
      { status: 403 },
    );
  }

  // 4) Parse body (supports both JSON and <form> POST)
  let email: string | null = null;
  let fullName: string | null = null;
  let role: string | null = null;

  const contentType = req.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const body = await req.json().catch(() => null);
    email = body?.email ? String(body.email).trim().toLowerCase() : null;
    fullName = body?.fullName ? String(body.fullName).trim() : null;
    role = body?.role ? String(body.role).trim() : null;
  } else {
    const formData = await req.formData().catch(() => null);
    if (formData) {
      const rawEmail = formData.get("email");
      const rawFullName = formData.get("fullName");
      const rawRole = formData.get("role");

      email =
        typeof rawEmail === "string"
          ? rawEmail.trim().toLowerCase()
          : null;
      fullName =
        typeof rawFullName === "string" ? rawFullName.trim() : null;
      role = typeof rawRole === "string" ? rawRole.trim() : null;
    }
  }

  if (!email || !email.includes("@")) {
    return NextResponse.json(
      { ok: false, error: "invalid_email" },
      { status: 400 },
    );
  }

  const inviteRole = role && role.length > 0 ? role : "admin";

  // 5) Find or create User
  let user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        fullName: fullName || null,
        globalRole: "USER",
        isActive: true,
      },
    });
  } else if (!user.fullName && fullName) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { fullName },
    });
  }

  // 6) Ensure UserTenantRole exists
  const existingRole = await prisma.userTenantRole.findFirst({
    where: { userId: user.id, tenantId },
  });

  if (!existingRole) {
    await prisma.userTenantRole.create({
      data: {
        userId: user.id,
        tenantId,
        role: inviteRole,
        isPrimary: false,
      },
    });
  }

  // 7) Create TenantInvitation with hashed token
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(rawToken);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // +7 days

  await prisma.tenantInvitation.create({
    data: {
      tenantId,
      userId: user.id,
      email,
      role: inviteRole,
      tokenHash,
      expiresAt,
    },
  });

  const baseUrl = getBaseUrl();
  const inviteUrl = `${baseUrl}/accept-invite?token=${encodeURIComponent(
    rawToken,
  )}`;

  const subject = `You're invited to ${
    tenant.name || tenant.slug || "a workspace"
  } on ThinkATS`;

  const htmlBody = `
    <p>Hi${fullName ? ` ${fullName}` : ""},</p>
    <p>You’ve been invited to join the <strong>${
      tenant.name || tenant.slug || "ThinkATS"
    }</strong> ATS workspace as <strong>${inviteRole}</strong>.</p>
    <p>Click the button below to accept your invite and sign in:</p>
    <p>
      <a href="${inviteUrl}" style="
        display:inline-block;
        padding:10px 18px;
        border-radius:999px;
        background-color:#172965;
        color:#ffffff;
        text-decoration:none;
        font-size:14px;
        font-weight:600;
      ">
        Accept invite
      </a>
    </p>
    <p>Or paste this URL into your browser:</p>
    <p><a href="${inviteUrl}">${inviteUrl}</a></p>
    <p>If you weren’t expecting this, you can safely ignore this email.</p>
    <p>— ThinkATS</p>
  `;

  let sendStatus: string = "sent";
  let errorMessage: string | null = null;
  let providerMessageId: string | null = null;

  if (!process.env.RESEND_API_KEY) {
    sendStatus = "failed";
    errorMessage = "RESEND_API_KEY not configured";
  } else {
    try {
      const from =
        process.env.EMAIL_FROM ||
        "ThinkATS <no-reply@thinkats.com>";

      const { data, error } = await resend.emails.send({
        from,
        to: [email],
        subject,
        html: htmlBody,
      });

      if (error) {
        sendStatus = "failed";
        errorMessage = error.message;
      } else {
        providerMessageId = data?.id ?? null;
      }
    } catch (err: any) {
      sendStatus = "failed";
      errorMessage =
        err?.message || "Unexpected error sending invite email";
    }
  }

  // 8) Log to SentEmail for audit trail
  await prisma.sentEmail.create({
    data: {
      tenantId,
      templateName: "tenant_admin_invite",
      toEmail: email,
      candidateId: null,
      jobId: null,
      subject,
      body: htmlBody,
      status: sendStatus,
      errorMessage: errorMessage || undefined,
      providerMessageId: providerMessageId || undefined,
      createdById: currentUser.id,
    },
  });

  if (sendStatus === "failed") {
    return NextResponse.json(
      { ok: false, error: "failed_to_send_email" },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, inviteUrl });
}
