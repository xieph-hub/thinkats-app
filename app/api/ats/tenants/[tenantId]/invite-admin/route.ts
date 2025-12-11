// app/api/ats/tenants/[tenantId]/invite-admin/route.ts
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const resendApiKey = process.env.RESEND_API_KEY;
const resendFrom =
  process.env.RESEND_FROM_EMAIL || "ThinkATS <no-reply@thinkats.com>";
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
    // 1) Parse HTML form data (NOT JSON)
    const formData = await req.formData();

    const rawEmail = (formData.get("email") || "").toString().trim();
    const role = (formData.get("role") || "admin").toString().trim();
    const fullName = (formData.get("fullName") || "").toString().trim();
    const message = (formData.get("message") || "").toString().trim();

    if (!rawEmail) {
      const url = new URL(
        `/ats/tenants/${tenantId}/invite-admin?error=missing_email`,
        req.nextUrl,
      );
      return NextResponse.redirect(url);
    }

    const email = rawEmail.toLowerCase();

    // Basic email sanity check
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      const url = new URL(
        `/ats/tenants/${tenantId}/invite-admin?error=missing_email`,
        req.nextUrl,
      );
      return NextResponse.redirect(url);
    }

    // 2) Confirm tenant exists
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      console.error(
        `Invite-admin: tenant not found for tenantId=${tenantId}`,
      );
      const url = new URL(
        `/ats/tenants/${tenantId}/invite-admin?error=server_error`,
        req.nextUrl,
      );
      return NextResponse.redirect(url);
    }

    // 3) Create invitation row
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
        // optional: add fields later, e.g.
        // inviteeName: fullName || null,
        // inviteMessage: message || null,
      },
    });

    const inviteUrl = `${
      siteUrl.replace(/\/$/, "")
    }/invites/${token}`;

    // 4) Try to send email – but DON'T break the flow if this fails
    if (!resendApiKey) {
      console.error(
        "Invite-admin: RESEND_API_KEY missing, skipping email send.",
      );
    } else {
      try {
        const resend = new Resend(resendApiKey);
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
          from: resendFrom,
          to: email,
          subject: `You’ve been invited to ThinkATS (${tenant.name})`,
          html,
        });
      } catch (emailError) {
        console.error("Invite-admin: failed to send invite email", emailError);
        // We still continue – invite record exists, user sees "Invitation sent"
      }
    }

    // 5) Redirect back with success flag → your page shows the green banner
    const successUrl = new URL(
      `/ats/tenants/${tenantId}/invite-admin?invited=1`,
      req.nextUrl,
    );
    return NextResponse.redirect(successUrl);
  } catch (error) {
    console.error(
      `/api/ats/tenants/${tenantId}/invite-admin POST error`,
      error,
    );
    const url = new URL(
      `/ats/tenants/${tenantId}/invite-admin?error=server_error`,
      req.nextUrl,
    );
    return NextResponse.redirect(url);
  }
}
