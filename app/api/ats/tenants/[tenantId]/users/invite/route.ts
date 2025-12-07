// app/api/ats/tenants/[tenantId]/users/invite/route.ts
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { createSupabaseRouteClient } from "@/lib/supabaseRouteClient";
import { resend } from "@/lib/resendClient";

export const runtime = "nodejs";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.thinkats.com";

const RESEND_FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL || "ThinkATS <no-reply@mail.thinkats.com>";

function normaliseRole(raw: FormDataEntryValue | null): "OWNER" | "ADMIN" | "RECRUITER" | "VIEWER" {
  const s = (raw || "").toString().trim().toUpperCase();
  if (s === "OWNER" || s === "ADMIN" || s === "RECRUITER" || s === "VIEWER") {
    return s;
  }
  return "RECRUITER";
}

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function POST(
  req: NextRequest,
  { params }: { params: { tenantId: string } },
) {
  const tenantId = params.tenantId;

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

  // Load acting app user
  const actingUser = await prisma.user.findUnique({
    where: { email: actingEmail },
  });

  if (!actingUser) {
    return NextResponse.json(
      { ok: false, error: "no_app_user" },
      { status: 403 },
    );
  }

  // Load tenant
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      id: true,
      name: true,
      slug: true,
    },
  });

  if (!tenant) {
    const url = new URL(`/ats/tenants`, req.url);
    url.searchParams.set("error", "tenant_not_found");
    return NextResponse.redirect(url, 303);
  }

  // Permission: superadmin OR OWNER/ADMIN of this tenant
  let isAllowed = false;

  if (actingUser.isSuperAdmin) {
    isAllowed = true;
  } else {
    const membership = await prisma.tenantMembership.findFirst({
      where: {
        tenantId,
        userId: actingUser.id,
        status: "ACTIVE",
      },
      select: { role: true },
    });

    if (membership && (membership.role === "OWNER" || membership.role === "ADMIN")) {
      isAllowed = true;
    }
  }

  if (!isAllowed) {
    return NextResponse.json(
      { ok: false, error: "forbidden" },
      { status: 403 },
    );
  }

  const formData = await req.formData();
  const emailRaw = formData.get("email");
  const fullNameRaw = formData.get("fullName");
  const roleRaw = formData.get("role");

  const invitedEmail = (emailRaw || "").toString().trim().toLowerCase();
  const fullName = (fullNameRaw || "").toString().trim();
  const role = normaliseRole(roleRaw);

  if (!invitedEmail) {
    const url = new URL(`/ats/tenants/${tenantId}/users`, req.url);
    url.searchParams.set("error", "missing_email");
    return NextResponse.redirect(url, 303);
  }

  try {
    // Upsert user
    let invitedUser = await prisma.user.findUnique({
      where: { email: invitedEmail },
    });

    if (!invitedUser) {
      invitedUser = await prisma.user.create({
        data: {
          email: invitedEmail,
          fullName: fullName || null,
          isSuperAdmin: false,
        },
      });
    } else if (fullName && !invitedUser.fullName) {
      invitedUser = await prisma.user.update({
        where: { id: invitedUser.id },
        data: { fullName },
      });
    }

    // Upsert membership
    await prisma.tenantMembership.upsert({
      where: {
        tenantId_userId: {
          tenantId,
          userId: invitedUser.id,
        },
      },
      create: {
        tenantId,
        userId: invitedUser.id,
        role,
        status: "INVITED",
        invitedByUserId: actingUser.id,
      },
      update: {
        role,
        status: "INVITED",
        invitedByUserId: actingUser.id,
      },
    });

    // Create invitation token
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await prisma.tenantInvitation.create({
      data: {
        tenantId,
        userId: invitedUser.id,
        email: invitedEmail,
        role,
        tokenHash,
        expiresAt,
      },
    });

    const inviteUrl = `${SITE_URL}/login?inviteToken=${encodeURIComponent(
      rawToken,
    )}&tenantId=${encodeURIComponent(tenantId)}`;

    // Send invite email
    const tenantName = tenant.name || tenant.slug || "a ThinkATS workspace";

    const html = `
      <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 14px; color: #0f172a;">
        <p>Hi${fullName ? ` ${fullName}` : ""},</p>
        <p><strong>${tenantName}</strong> has invited you to collaborate on their ATS workspace on ThinkATS.</p>
        <p>You can accept your invitation and sign in using the button below:</p>
        <p>
          <a href="${inviteUrl}"
             style="display:inline-block;padding:10px 18px;border-radius:999px;background:#172965;color:#ffffff;font-weight:600;text-decoration:none;">
            Accept invitation
          </a>
        </p>
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="word-break:break-all;"><a href="${inviteUrl}">${inviteUrl}</a></p>
        <p style="color:#6b7280;font-size:12px;margin-top:24px;">
          This link will expire in 7 days. If you weren't expecting this, you can safely ignore this email.
        </p>
      </div>
    `.trim();

    await resend.emails.send({
      from: RESEND_FROM_EMAIL,
      to: invitedEmail,
      subject: `You’ve been invited to ThinkATS – ${tenantName}`,
      html,
    });

    const url = new URL(`/ats/tenants/${tenantId}/users`, req.url);
    url.searchParams.set("invited", "1");
    url.searchParams.set("email", invitedEmail);
    return NextResponse.redirect(url, 303);
  } catch (err) {
    console.error("Error inviting tenant user:", err);
    const url = new URL(`/ats/tenants/${tenantId}/users`, req.url);
    url.searchParams.set("error", "invite_failed");
    return NextResponse.redirect(url, 303);
  }
}
