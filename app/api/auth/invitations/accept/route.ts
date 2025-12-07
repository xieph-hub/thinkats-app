// app/api/auth/invitations/accept/route.ts
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { createSupabaseRouteClient } from "@/lib/supabaseRouteClient";

export const runtime = "nodejs";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.thinkats.com";

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function POST(req: NextRequest) {
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

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    // ignore
  }

  const inviteToken = (body?.inviteToken || "").toString().trim();
  const tenantIdFromBody = (body?.tenantId || "").toString().trim() || null;

  if (!inviteToken) {
    return NextResponse.json(
      { ok: false, error: "missing_invite_token" },
      { status: 400 },
    );
  }

  const tokenHash = hashToken(inviteToken);

  // Find a valid, unused, non-expired invitation
  const invitation = await prisma.tenantInvitation.findFirst({
    where: {
      tokenHash,
      usedAt: null,
      expiresAt: { gt: new Date() },
      ...(tenantIdFromBody ? { tenantId: tenantIdFromBody } : {}),
    },
  });

  if (!invitation) {
    return NextResponse.json(
      { ok: false, error: "invalid_or_expired_invite" },
      { status: 400 },
    );
  }

  const inviteEmail = invitation.email.toLowerCase();
  const authEmail = supaUser.email.toLowerCase();

  if (inviteEmail !== authEmail) {
    // user logged in with a different email to the one that was invited
    return NextResponse.json(
      { ok: false, error: "invite_email_mismatch" },
      { status: 403 },
    );
  }

  // Ensure we have an app-level User row
  let user = await prisma.user.findUnique({
    where: { email: authEmail },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: authEmail,
        isActive: true,
        fullName: supaUser.user_metadata?.full_name || null,
        globalRole: "USER",
      },
    });
  }

  const tenantId = invitation.tenantId;

  // Check if user already has a role on this tenant
  const existingRoles = await prisma.userTenantRole.findMany({
    where: {
      userId: user.id,
    },
  });

  const existingOnThisTenant = existingRoles.find(
    (r) => r.tenantId === tenantId,
  );

  const isFirstTenantForUser = existingRoles.length === 0;
  const roleFromInvite = invitation.role || "admin";

  if (!existingOnThisTenant) {
    // New membership for this tenant
    await prisma.userTenantRole.create({
      data: {
        userId: user.id,
        tenantId,
        role: roleFromInvite,
        isPrimary: isFirstTenantForUser,
      },
    });
  } else {
    // Already has membership – optionally upgrade role
    await prisma.userTenantRole.update({
      where: { id: existingOnThisTenant.id },
      data: {
        role: roleFromInvite,
      },
    });
  }

  // Mark invitation as used
  await prisma.tenantInvitation.update({
    where: { id: invitation.id },
    data: {
      usedAt: new Date(),
      userId: user.id,
    },
  });

  // Optional: log to ActivityLog
  try {
    await prisma.activityLog.create({
      data: {
        tenantId,
        actorId: user.id,
        entityType: "user",
        entityId: user.id,
        action: "tenant_invite_accepted",
        metadata: {
          email: inviteEmail,
          role: roleFromInvite,
        } as any,
      },
    });
  } catch (err) {
    console.error("Failed to log invite acceptance", err);
  }

  const redirectTo = `${SITE_URL}/ats?tenantId=${encodeURIComponent(
    tenantId,
  )}`;

  return NextResponse.json({
    ok: true,
    tenantId,
    redirectTo,
  });
}
