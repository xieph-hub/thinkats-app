// app/api/ats/tenants/[tenantId]/users/invite/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSupabaseRouteClient } from "@/lib/supabaseRouteClient";
import { Resend } from "resend";
import { randomBytes, createHash } from "crypto";

const resend = new Resend(process.env.RESEND_API_KEY);
const APP_NAME = "ThinkATS";

type RouteContext = {
  params: { tenantId: string };
};

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    const tenantId = params.tenantId;
    if (!tenantId) {
      return NextResponse.json(
        { ok: false, error: "missing_tenant_id" },
        { status: 400 },
      );
    }

    // -------------------------------------------------------------------
    // 1) Who is acting?
    // -------------------------------------------------------------------
    const supabase = createSupabaseRouteClient();
    const {
      data: { user: supaUser },
      error: supaError,
    } = await supabase.auth.getUser();

    if (supaError || !supaUser || !supaUser.email) {
      return NextResponse.json(
        { ok: false, error: "unauthenticated" },
        { status: 401 },
      );
    }

    const actingEmail = supaUser.email.toLowerCase();

    const actingUser = await prisma.user.findUnique({
      where: { email: actingEmail },
      select: {
        id: true,
        fullName: true,
        email: true,
        globalRole: true,
        isActive: true,
      },
    });

    if (!actingUser || !actingUser.isActive) {
      return NextResponse.json(
        { ok: false, error: "user_not_found" },
        { status: 401 },
      );
    }

    // -------------------------------------------------------------------
    // 2) Check tenant exists
    // -------------------------------------------------------------------
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        name: true,
      },
    });

    if (!tenant) {
      return NextResponse.json(
        { ok: false, error: "tenant_not_found" },
        { status: 404 },
      );
    }

    // -------------------------------------------------------------------
    // 3) Authorisation: SUPER_ADMIN or tenant owner/admin
    // -------------------------------------------------------------------
    const isSuperAdmin = actingUser.globalRole === "SUPER_ADMIN";
    let isAllowed = false;

    if (isSuperAdmin) {
      isAllowed = true;
    } else {
      const membership = await prisma.userTenantRole.findFirst({
        where: {
          userId: actingUser.id,
          tenantId,
          role: { in: ["owner", "admin"] },
        },
      });

      if (membership) {
        isAllowed = true;
      }
    }

    if (!isAllowed) {
      return NextResponse.json(
        { ok: false, error: "forbidden" },
        { status: 403 },
      );
    }

    // -------------------------------------------------------------------
    // 4) Parse request body (JSON only for now)
    // -------------------------------------------------------------------
    const body = await req.json().catch(() => null);

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { ok: false, error: "invalid_body" },
        { status: 400 },
      );
    }

    const rawEmail = (body as any).email as string | undefined;
    const rawRole = (body as any).role as string | undefined;

    if (!rawEmail || !rawEmail.trim()) {
      return NextResponse.json(
        { ok: false, error: "invalid_email" },
        { status: 400 },
      );
    }

    const invitedEmail = rawEmail.trim().toLowerCase();
    const role = (rawRole || "admin").trim() || "admin";

    if (invitedEmail === actingEmail) {
      return NextResponse.json(
        { ok: false, error: "cannot_invite_self" },
        { status: 400 },
      );
    }

    // -------------------------------------------------------------------
    // 5) Check if user already exists + already a member
    // -------------------------------------------------------------------
    const existingUser = await prisma.user.findUnique({
      where: { email: invitedEmail },
      select: { id: true },
    });

    if (existingUser) {
      const existingMembership = await prisma.userTenantRole.findFirst({
        where: {
          userId: existingUser.id,
          tenantId,
        },
      });

      if (existingMembership) {
        return NextResponse.json(
          { ok: false, error: "already_member" },
          { status: 400 },
        );
      }
    }

    // -------------------------------------------------------------------
    // 6) Check for existing active invite
    // -------------------------------------------------------------------
    const now = new Date();

    const activeInvite = await prisma.tenantInvitation.findFirst({
      where: {
        tenantId,
        email: invitedEmail,
        usedAt: null,
        expiresAt: { gt: now },
      },
    });

    if (activeInvite) {
      return NextResponse.json(
        { ok: false, error: "invite_already_sent" },
        { status: 400 },
      );
    }

    // -------------------------------------------------------------------
    // 7) Create new invite (+ hashed token)
    // -------------------------------------------------------------------
    const rawToken = randomBytes(32).toString("hex");
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await prisma.tenantInvitation.create({
      data: {
        tenantId,
        userId: existingUser?.id ?? null,
        email: invitedEmail,
        role,
        tokenHash,
        expiresAt,
      },
    });

    // -------------------------------------------------------------------
    // 8) Send email via Resend (if configured)
    // -------------------------------------------------------------------
    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.thinkats.com";

    const inviteUrl = `${baseUrl}/login?inviteToken=${encodeURIComponent(
      rawToken,
    )}&tenantId=${encodeURIComponent(tenantId)}`;

    if (process.env.RESEND_API_KEY) {
      await resend.emails.send({
        from: `ThinkATS <hello@thinkats.com>`,
        to: [invitedEmail],
        subject: `You've been invited to ${tenant.name} on ThinkATS`,
        html: `
          <p>Hi,</p>
          <p>${
            actingUser.fullName ?? "A workspace admin"
          } has invited you to join the <strong>${tenant.name}</strong> ATS workspace on <strong>${APP_NAME}</strong>.</p>
          <p>Click the button below to accept the invitation and sign in:</p>
          <p>
            <a href="${inviteUrl}" style="display:inline-block;padding:10px 16px;border-radius:999px;background-color:#172965;color:#ffffff;text-decoration:none;font-weight:600;">
              Accept invitation
            </a>
          </p>
          <p>Or paste this link into your browser:</p>
          <p><a href="${inviteUrl}">${inviteUrl}</a></p>
          <p>This link will expire in 7 days.</p>
        `,
      });
    }

    // -------------------------------------------------------------------
    // 9) Done
    // -------------------------------------------------------------------
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Invite user error", err);
    return NextResponse.json(
      { ok: false, error: "unexpected_error" },
      { status: 500 },
    );
  }
}
