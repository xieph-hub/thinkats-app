// app/api/ats/invitations/accept/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSupabaseRouteClient } from "@/lib/supabaseRouteClient";
import { createHash } from "crypto";

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { ok: false, error: "invalid_body" },
        { status: 400 },
      );
    }

    const { inviteToken, tenantId } = body as {
      inviteToken?: string;
      tenantId?: string;
    };

    if (!inviteToken || typeof inviteToken !== "string") {
      return NextResponse.json(
        { ok: false, error: "missing_invite_token" },
        { status: 400 },
      );
    }

    const normalizedToken = inviteToken.trim();
    if (!normalizedToken) {
      return NextResponse.json(
        { ok: false, error: "invalid_invite_token" },
        { status: 400 },
      );
    }

    const now = new Date();

    // Support BOTH:
    // - old links: raw token (db.tokenHash == hash(raw))
    // - new links: tokenHash directly (db.tokenHash == inviteToken)
    const candidateHash = hashToken(normalizedToken);

    const invite = await prisma.tenantInvitation.findFirst({
      where: {
        usedAt: null,
        expiresAt: { gt: now },
        OR: [
          { tokenHash: candidateHash },       // raw token (old emails)
          { tokenHash: normalizedToken },     // hashed token (copy / resend links)
        ],
      },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!invite) {
      return NextResponse.json(
        { ok: false, error: "invalid_or_expired_invite" },
        { status: 400 },
      );
    }

    if (tenantId && invite.tenantId !== tenantId) {
      return NextResponse.json(
        { ok: false, error: "tenant_mismatch" },
        { status: 400 },
      );
    }

    // Supabase auth user (must match invite email)
    const supabase = createSupabaseRouteClient();
    const {
      data: { user: supaUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !supaUser || !supaUser.email) {
      return NextResponse.json(
        { ok: false, error: "unauthenticated" },
        { status: 401 },
      );
    }

    const email = supaUser.email.toLowerCase();

    if (email !== invite.email.toLowerCase()) {
      return NextResponse.json(
        { ok: false, error: "email_mismatch" },
        { status: 403 },
      );
    }

    // Ensure app-level User exists
    let appUser = await prisma.user.findUnique({
      where: { email },
    });

    if (!appUser) {
      appUser = await prisma.user.create({
        data: {
          email,
          fullName:
            (supaUser.user_metadata as any)?.full_name ??
            supaUser.email.split("@")[0] ??
            null,
          globalRole: "USER",
          isActive: true,
        },
      });
    }

    // Ensure membership exists (or update role)
    const existingMembership = await prisma.userTenantRole.findFirst({
      where: {
        userId: appUser.id,
        tenantId: invite.tenantId,
      },
    });

    if (!existingMembership) {
      await prisma.userTenantRole.create({
        data: {
          userId: appUser.id,
          tenantId: invite.tenantId,
          role: invite.role,
          isPrimary: false,
        },
      });
    } else if (existingMembership.role !== invite.role) {
      await prisma.userTenantRole.update({
        where: { id: existingMembership.id },
        data: { role: invite.role },
      });
    }

    // Mark invite as used
    await prisma.tenantInvitation.update({
      where: { id: invite.id },
      data: {
        usedAt: now,
        userId: appUser.id,
      },
    });

    const redirectTo = `/ats/tenants/${invite.tenantId}/jobs`;

    return NextResponse.json({ ok: true, redirectTo });
  } catch (err) {
    console.error("Accept ATS invitation error", err);
    return NextResponse.json(
      { ok: false, error: "unexpected_error" },
      { status: 500 },
    );
  }
}
