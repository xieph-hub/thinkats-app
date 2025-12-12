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
const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.thinkats.com").replace(/\/$/, "");

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function escapeHtml(s: string) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function GET() {
  return NextResponse.json({ ok: false, error: "method_not_allowed" }, { status: 405 });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { tenantId: string } },
) {
  const tenantParam = String(params.tenantId || "").trim();

  try {
    const formData = await req.formData();

    const rawEmail = String(formData.get("email") || "").trim();
    const role = String(formData.get("role") || "admin").trim();
    const fullName = String(formData.get("fullName") || "").trim();
    const message = String(formData.get("message") || "").trim();

    if (!rawEmail) {
      return NextResponse.json({ ok: false, error: "missing_email" }, { status: 400 });
    }

    const email = rawEmail.toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return NextResponse.json({ ok: false, error: "invalid_email" }, { status: 400 });
    }

    // Resolve tenant by UUID OR slug (your screenshot shows you're using slug URLs)
    const tenant = isUuid(tenantParam)
      ? await prisma.tenant.findUnique({
          where: { id: tenantParam },
          select: { id: true, name: true },
        })
      : await prisma.tenant.findUnique({
          where: { slug: tenantParam },
          select: { id: true, name: true },
        });

    if (!tenant) {
      return NextResponse.json({ ok: false, error: "tenant_not_found" }, { status: 404 });
    }

    const token = crypto.randomUUID();
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await prisma.tenantInvitation.create({
      data: {
        tenantId: tenant.id,
        email,
        role,
        tokenHash,
        expiresAt,
      },
    });

    const inviteUrl = `${siteUrl}/invites/${token}`;

    let emailStatus: "sent" | "failed" | "skipped" = "skipped";
    let emailErrorHint = "";

    if (!resendApiKey) {
      emailStatus = "skipped";
      emailErrorHint = "missing_RESEND_API_KEY_in_this_deployment";
      console.error("Invite-admin: RESEND_API_KEY missing (check Vercel env scope).");
    } else {
      try {
        const resend = new Resend(resendApiKey);
        const safeName = fullName || "there";

        const html = `
          <div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; line-height: 1.5;">
            <p>Hi ${escapeHtml(safeName)},</p>
            <p>You’ve been invited to join the <strong>${escapeHtml(tenant.name)}</strong> workspace on ThinkATS.</p>
            <p><a href="${inviteUrl}">Accept your invitation</a> (link expires in 7 days).</p>
            ${
              message
                ? `<p style="margin-top:16px;"><em>Personal note:</em><br/>${escapeHtml(message)}</p>`
                : ""
            }
            <p style="margin-top:20px;color:#6b7280;font-size:12px;">
              If you didn’t expect this invite, you can ignore this email.
            </p>
          </div>
        `;

        const sendRes = await resend.emails.send({
          from: resendFrom,
          to: [email],
          subject: `You’ve been invited to ThinkATS (${tenant.name})`,
          html,
        });

        emailStatus = "sent";
        console.log("Invite-admin: sent", { to: email, resendId: (sendRes as any)?.id });
      } catch (err: any) {
        emailStatus = "failed";
        emailErrorHint = String(err?.message || "send_failed").slice(0, 160);
        console.error("Invite-admin: resend send failed", err);
      }
    }

    return NextResponse.json({
      ok: true,
      inviteUrl,
      emailStatus,
      ...(emailErrorHint ? { emailErrorHint } : {}),
    });
  } catch (err) {
    console.error("Invite-admin: route crashed", err);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
