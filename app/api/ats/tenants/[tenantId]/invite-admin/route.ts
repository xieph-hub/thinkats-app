import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
const RESEND_FROM =
  process.env.RESEND_FROM_EMAIL || "ThinkATS <no-reply@thinkats.com>";
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.thinkats.com").replace(
  /\/$/,
  "",
);

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function isEmail(email: string) {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
}

function redirectWith(
  req: NextRequest,
  tenantId: string,
  params: Record<string, string>,
) {
  const url = new URL(`/ats/tenants/${tenantId}/invite-admin`, req.nextUrl);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return NextResponse.redirect(url);
}

export async function POST(
  req: NextRequest,
  { params }: { params: { tenantId: string } },
) {
  const tenantId = params.tenantId;

  try {
    const formData = await req.formData();

    const rawEmail = String(formData.get("email") || "").trim();
    const role = String(formData.get("role") || "admin").trim();
    const fullName = String(formData.get("fullName") || "").trim();
    const message = String(formData.get("message") || "").trim();

    if (!rawEmail) {
      return redirectWith(req, tenantId, { error: "missing_email" });
    }

    const email = rawEmail.toLowerCase();
    if (!isEmail(email)) {
      return redirectWith(req, tenantId, { error: "invalid_email" });
    }

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) {
      return redirectWith(req, tenantId, { error: "tenant_not_found" });
    }

    // Create invite
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
      },
    });

    const inviteUrl = `${SITE_URL}/invites/${token}`;

    // If no key, don’t pretend. Still created invite record, but no email.
    if (!RESEND_API_KEY) {
      console.error("Invite-admin: RESEND_API_KEY missing (Production?)");
      return redirectWith(req, tenantId, {
        invited: "1",
        emailSent: "0",
        error: "resend_not_configured",
        inviteUrl: encodeURIComponent(inviteUrl),
      });
    }

    // Send via Resend (and surface errors)
    const resend = new Resend(RESEND_API_KEY);

    const safeName = fullName || "there";
    const subject = `You’ve been invited to ThinkATS (${tenant.name})`;

    const html = `
      <div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto; line-height:1.5">
        <p>Hi ${escapeHtml(safeName)},</p>
        <p>You’ve been invited to join the <strong>${escapeHtml(
          tenant.name ?? "a tenant workspace",
        )}</strong> workspace on ThinkATS.</p>

        <p style="margin:18px 0">
          <a href="${inviteUrl}" style="display:inline-block;background:#172965;color:#fff;padding:10px 14px;border-radius:999px;text-decoration:none;font-weight:600">
            Accept invitation
          </a>
        </p>

        <p style="font-size:12px;color:#475569">Or copy this link:</p>
        <p style="font-size:12px;color:#0f172a;word-break:break-all">${inviteUrl}</p>

        ${
          message
            ? `<hr style="border:none;border-top:1px solid #e2e8f0;margin:18px 0" />
               <p style="font-size:12px;color:#475569;margin:0 0 6px">Personal note:</p>
               <p style="margin:0">${escapeHtml(message)}</p>`
            : ""
        }

        <p style="margin-top:18px;font-size:12px;color:#64748b">
          This link expires in 7 days.
        </p>
      </div>
    `;

    const result: any = await resend.emails.send({
      from: RESEND_FROM,
      to: email,
      subject,
      html,
      text: `Hi ${safeName},

You've been invited to join ${tenant.name} on ThinkATS.

Accept invitation: ${inviteUrl}

This link expires in 7 days.`,
    });

    // Resend sometimes returns { data, error } instead of throwing
    if (result?.error) {
      console.error("Invite-admin: Resend error:", result.error);
      return redirectWith(req, tenantId, {
        invited: "1",
        emailSent: "0",
        error: "email_send_failed",
        inviteUrl: encodeURIComponent(inviteUrl),
      });
    }

    return redirectWith(req, tenantId, {
      invited: "1",
      emailSent: "1",
    });
  } catch (err) {
    console.error("Invite-admin POST error:", err);
    return redirectWith(req, params.tenantId, { error: "server_error" });
  }
}

// minimal HTML escaping for user-provided fields
function escapeHtml(input: string) {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
