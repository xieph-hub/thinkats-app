// app/api/ats/tenants/[tenantId]/users/resend-invite/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSupabaseRouteClient } from "@/lib/supabaseRouteClient";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const APP_NAME = "ThinkATS";

type RouteContext = {
  params: { tenantId: string };
};

export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    const tenantId = params.tenantId;
    if (!tenantId) {
      return NextResponse.json(
        { ok: false, error: "missing_tenant_id" },
        { status: 400 },
      );
    }

    const body = await req.json().catch(() => null);

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { ok: false, error: "invalid_body" },
        { status: 400 },
      );
    }

    const { invitationId } = body as { invitationId?: string };

    if (!invitationId || !invitationId.trim()) {
      return NextResponse.json(
        { ok: false, error: "missing_invitation_id" },
        { status: 400 },
      );
    }

    // Who is acting?
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

    // Check tenant exists
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

    // Authorisation: SUPER_ADMIN or tenant owner/admin
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

    // Find invite
    const invite = await prisma.tenantInvitation.findFirst({
      where: {
        id: invitationId,
        tenantId,
      },
    });

    if (!invite) {
      return NextResponse.json(
        { ok: false, error: "invite_not_found" },
        { status: 404 },
      );
    }

    if (invite.usedAt) {
      return NextResponse.json(
        { ok: false, error: "invite_already_used" },
        { status: 400 },
      );
    }

    const now = new Date();
    const newExpiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // +7 days

    const updatedInvite = await prisma.tenantInvitation.update({
      where: { id: invite.id },
      data: {
        expiresAt: newExpiresAt,
      },
    });

    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.thinkats.com";

    const inviteToken = updatedInvite.tokenHash;
    const inviteUrl = `${baseUrl}/login?inviteToken=${encodeURIComponent(
      inviteToken,
    )}&tenantId=${encodeURIComponent(tenantId)}`;

    if (process.env.RESEND_API_KEY) {
      await resend.emails.send({
        from: `ThinkATS <hello@thinkats.com>`,
        to: [updatedInvite.email],
        subject: `Reminder: your invitation to ${tenant.name} on ThinkATS`,
        html: `
          <p>Hi,</p>
          <p>This is a reminder that you&apos;ve been invited to join the <strong>${tenant.name}</strong> ATS workspace on <strong>${APP_NAME}</strong>.</p>
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

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Resend invite error", err);
    return NextResponse.json(
      { ok: false, error: "unexpected_error" },
      { status: 500 },
    );
  }
}
