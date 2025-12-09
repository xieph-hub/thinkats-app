// app/api/ats/tenants/[tenantId]/invite-admin/route.ts
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import { getServerUser } from "@/lib/auth/getServerUser";

const resend = new Resend(process.env.RESEND_API_KEY);

// Small helper so we always have a safe base URL
function getBaseUrl() {
  const env = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL;
  try {
    return env ? new URL(env).origin : "https://www.thinkats.com";
  } catch {
    return "https://www.thinkats.com";
  }
}

function generateInviteToken() {
  const token = crypto.randomBytes(24).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  return { token, tokenHash };
}

type RouteParams = {
  params: { tenantId: string };
};

export async function POST(req: NextRequest, { params }: RouteParams) {
  const { tenantId } = params;

  // 1) Auth: must be logged in
  const currentUser = await getServerUser();
  if (!currentUser) {
    return NextResponse.json(
      { ok: false, error: "unauthenticated" },
      { status: 401 },
    );
  }

  // NOTE: this is the fix — use userId, not id
  const currentUserId = (currentUser as any).userId as string | undefined;

  if (!currentUserId) {
    return NextResponse.json(
      { ok: false, error: "invalid_user_context" },
      { status: 500 },
    );
  }

  // 2) Validate tenant
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
  });

  if (!tenant) {
    return NextResponse.json(
      { ok: false, error: "tenant_not_found" },
      { status: 404 },
    );
  }

  // 3) Parse body
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid_json" },
      { status: 400 },
    );
  }

  const rawEmail = (body.email as string | undefined) ?? "";
  const role = (body.role as string | undefined) ?? "admin";
  const fullName = (body.fullName as string | undefined) ?? null;

  const email = rawEmail.trim().toLowerCase();
  if (!email) {
    return NextResponse.json(
      { ok: false, error: "missing_email" },
      { status: 400 },
    );
  }

  // 4) Authorisation: super admin OR admin/owner on this tenant
  const membership = await prisma.userTenantRole.findFirst({
    where: {
      userId: currentUserId,
      tenantId,
    },
  });

  const isAllowed =
    currentUser.isSuperAdmin ||
    membership?.role === "owner" ||
    membership?.role === "admin";

  if (!isAllowed) {
    return NextResponse.json(
      { ok: false, error: "forbidden" },
      { status: 403 },
    );
  }

  // 5) Find or create User
  let invitedUser = await prisma.user.findUnique({
    where: { email },
  });

  if (!invitedUser) {
    invitedUser = await prisma.user.create({
      data: {
        email,
        fullName,
        globalRole: "USER",
        isActive: true,
      },
    });
  }

  // 6) Ensure a UserTenantRole exists (or upgrade the role)
  const existingRole = await prisma.userTenantRole.findFirst({
    where: {
      userId: invitedUser.id,
      tenantId,
    },
  });

  if (!existingRole) {
    await prisma.userTenantRole.create({
      data: {
        userId: invitedUser.id,
        tenantId,
        role, // "owner" | "admin" | "recruiter" | "viewer"
        isPrimary: false,
      },
    });
  } else if (existingRole.role !== role) {
    await prisma.userTenantRole.update({
      where: { id: existingRole.id },
      data: { role },
    });
  }

  // 7) Create invitation record
  const { token, tokenHash } = generateInviteToken();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  await prisma.tenantInvitation.create({
    data: {
      tenantId,
      userId: invitedUser.id,
      email,
      role,
      tokenHash,
      expiresAt,
    },
  });

  // 8) Send email via Resend + log it in SentEmail
  const baseUrl = getBaseUrl();
  // For now, route them to /login with the email prefilled.
  // Later, you can add a dedicated /accept-invite route that consumes the token.
  const loginUrl = `${baseUrl}/login?email=${encodeURIComponent(email)}`;

  const subject = `You’ve been invited to ${tenant.name} on ThinkATS`;
  const bodyHtml = `
    <p>Hi${fullName ? ` ${fullName}` : ""},</p>
    <p>You’ve been invited to access the <strong>${tenant.name}</strong> ATS workspace on ThinkATS.</p>
    <p>To get started:</p>
    <ol>
      <li>Click the button below or go to <code>${loginUrl}</code>.</li>
      <li>Sign in with this email address: <strong>${email}</strong>.</li>
      <li>We’ll send you a one-time code (OTP) to finish the login.</li>
    </ol>
    <p style="margin-top:16px;">
      <a href="${loginUrl}" style="display:inline-block;background:#172965;color:#ffffff;padding:10px 18px;border-radius:999px;font-size:13px;text-decoration:none;font-weight:600;">
        Open ThinkATS
      </a>
    </p>
    <p style="margin-top:16px;font-size:12px;color:#6b7280;">
      If you weren’t expecting this invitation, you can safely ignore this email.
    </p>
  `;

  try {
    if (process.env.RESEND_API_KEY) {
      await resend.emails.send({
        from:
          process.env.RESEND_FROM_EMAIL ||
          "ThinkATS <no-reply@thinkats.com>",
        to: [email],
        subject,
        html: bodyHtml,
      });
    }

    // Log in SentEmail for audit trail
    await prisma.sentEmail.create({
      data: {
        tenantId,
        templateId: null,
        templateName: "tenant_admin_invite",
        toEmail: email,
        candidateId: null,
        jobId: null,
        subject,
        body: bodyHtml,
        status: "sent",
        errorMessage: null,
        providerMessageId: null,
        createdById: currentUserId,
        sentAt: new Date(),
      },
    });
  } catch (err: any) {
    // Even if email send fails, you still have the invitation + membership.
    console.error("Error sending invite email", err);
    await prisma.sentEmail.create({
      data: {
        tenantId,
        templateId: null,
        templateName: "tenant_admin_invite",
        toEmail: email,
        candidateId: null,
        jobId: null,
        subject,
        body: bodyHtml,
        status: "failed",
        errorMessage: String(err?.message ?? "Unknown error"),
        providerMessageId: null,
        createdById: currentUserId,
        sentAt: new Date(),
      },
    });

    return NextResponse.json(
      {
        ok: false,
        error: "invite_email_failed",
        // still return some context so the UI can show:
        // "Invite created but email failed — please resend manually."
        detail:
          "Invitation created, but we couldn’t send the email automatically.",
      },
      { status: 500 },
    );
  }

  return NextResponse.json(
    {
      ok: true,
      tenantId,
      email,
      role,
    },
    { status: 200 },
  );
}
