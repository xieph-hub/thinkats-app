// app/api/ats/tenants/[tenantId]/invite-admin/route.ts
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";
import { getServerUser } from "@/lib/auth/getServerUser";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const resendApiKey = process.env.RESEND_API_KEY;
const resendFrom =
  process.env.RESEND_FROM_EMAIL || "ThinkATS <no-reply@thinkats.com>";
const supportEmail = process.env.SUPPORT_EMAIL || "support@thinkats.com";
const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.thinkats.com").replace(
  /\/$/,
  "",
);

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    v,
  );
}

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function escapeHtml(s: string) {
  return String(s || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function buildInviteEmail(args: {
  recipientName?: string | null;
  recipientEmail: string;
  tenantName: string;
  role: string;
  inviteUrl: string;
  personalMessage?: string | null;
  expiresInDays?: number;
}) {
  const {
    recipientName,
    recipientEmail,
    tenantName,
    role,
    inviteUrl,
    personalMessage,
    expiresInDays = 7,
  } = args;

  const safeName = (recipientName || "there").trim();
  const preheader = `You’ve been invited to join ${tenantName} on ThinkATS.`;

  const subject = `Invitation to ThinkATS: ${tenantName}`;

  const text = [
    `Hi ${safeName},`,
    ``,
    `You’ve been invited to join the "${tenantName}" workspace on ThinkATS.`,
    `Role: ${role}`,
    ``,
    `Accept invitation (expires in ${expiresInDays} days):`,
    inviteUrl,
    ``,
    personalMessage ? `Message from the inviter:\n${personalMessage}\n` : "",
    `If you weren’t expecting this invitation, you can ignore this email.`,
    ``,
    `Need help? ${supportEmail}`,
  ]
    .filter(Boolean)
    .join("\n");

  const html = `
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
    ${escapeHtml(preheader)}
  </div>

  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3f4f6;padding:24px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="width:600px;max-width:600px;background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;">
          <tr>
            <td style="padding:20px 24px;border-bottom:1px solid #e5e7eb;">
              <div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;color:#0f172a;">
                <div style="font-size:14px;font-weight:700;">ThinkATS</div>
                <div style="font-size:12px;color:#64748b;margin-top:2px;">Secure workspace invitation</div>
              </div>
            </td>
          </tr>

          <tr>
            <td style="padding:22px 24px 8px;">
              <div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;color:#0f172a;line-height:1.5;">
                <div style="font-size:18px;font-weight:800;margin:0 0 8px;">You’ve been invited</div>

                <div style="font-size:13px;color:#334155;margin:0 0 14px;">
                  Hi ${escapeHtml(safeName)}, you’ve been invited to join the
                  <strong>${escapeHtml(tenantName)}</strong> workspace on ThinkATS.
                </div>

                <table role="presentation" cellspacing="0" cellpadding="0" style="margin:12px 0 16px;">
                  <tr>
                    <td style="font-size:12px;color:#64748b;padding-right:16px;">Role</td>
                    <td style="font-size:12px;color:#0f172a;font-weight:700;">${escapeHtml(role)}</td>
                  </tr>
                  <tr>
                    <td style="font-size:12px;color:#64748b;padding-right:16px;padding-top:6px;">Recipient</td>
                    <td style="font-size:12px;color:#0f172a;padding-top:6px;">${escapeHtml(recipientEmail)}</td>
                  </tr>
                  <tr>
                    <td style="font-size:12px;color:#64748b;padding-right:16px;padding-top:6px;">Expiry</td>
                    <td style="font-size:12px;color:#0f172a;padding-top:6px;">${expiresInDays} days</td>
                  </tr>
                </table>

                ${
                  personalMessage
                    ? `<div style="margin:14px 0 16px;padding:12px 14px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;">
                         <div style="font-size:12px;color:#64748b;font-weight:700;margin-bottom:6px;">Message from the inviter</div>
                         <div style="font-size:13px;color:#0f172a;white-space:pre-wrap;">${escapeHtml(
                           personalMessage,
                         )}</div>
                       </div>`
                    : ""
                }

                <table role="presentation" cellspacing="0" cellpadding="0" style="margin:10px 0 16px;">
                  <tr>
                    <td align="center" bgcolor="#172965" style="border-radius:999px;">
                      <a href="${inviteUrl}" style="display:inline-block;padding:10px 16px;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;font-size:13px;font-weight:800;color:#ffffff;text-decoration:none;border-radius:999px;">
                        Accept invitation
                      </a>
                    </td>
                  </tr>
                </table>

                <div style="font-size:12px;color:#64748b;margin:0 0 8px;">
                  If the button doesn’t work, copy and paste this link:
                </div>
                <div style="font-size:12px;color:#0f172a;word-break:break-all;border:1px solid #e5e7eb;background:#ffffff;border-radius:12px;padding:10px 12px;">
                  ${escapeHtml(inviteUrl)}
                </div>

                <div style="font-size:12px;color:#64748b;margin:14px 0 0;">
                  Security note: This is a single-use link. If you weren’t expecting this invitation, you can ignore this email.
                </div>
              </div>
            </td>
          </tr>

          <tr>
            <td style="padding:16px 24px;border-top:1px solid #e5e7eb;background:#fafafa;">
              <div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;font-size:12px;color:#64748b;line-height:1.5;">
                Need help? <a href="mailto:${escapeHtml(
                  supportEmail,
                )}" style="color:#172965;text-decoration:none;font-weight:700;">${escapeHtml(
    supportEmail,
  )}</a>.
                <br/>
                © ${new Date().getFullYear()} ThinkATS. Transactional email.
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
  `;

  return { subject, html, text };
}

function wantsHtmlResponse(req: NextRequest) {
  const accept = req.headers.get("accept") || "";
  // Form navigations typically accept text/html
  return accept.includes("text/html");
}

export async function GET() {
  return NextResponse.json(
    { ok: false, error: "method_not_allowed" },
    { status: 405 },
  );
}

export async function POST(
  req: NextRequest,
  { params }: { params: { tenantId: string } },
) {
  const tenantParam = String(params.tenantId || "").trim();
  const backPath = `/ats/tenants/${encodeURIComponent(tenantParam)}/invite-admin`;

  try {
    // ✅ AUTH GUARD (super admin OR tenant owner/admin)
    const ctx: any = await getServerUser();
    const authedEmail: string | null = ctx?.user?.email || null;

    if (!authedEmail) {
      if (wantsHtmlResponse(req)) {
        return NextResponse.redirect(new URL(`${backPath}?error=unauthenticated`, req.nextUrl));
      }
      return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 });
    }

    const formData = await req.formData();
    const rawEmail = String(formData.get("email") || "").trim();
    const role = String(formData.get("role") || "admin").trim();
    const fullName = String(formData.get("fullName") || "").trim();
    const message = String(formData.get("message") || "").trim();

    if (!rawEmail) {
      if (wantsHtmlResponse(req)) {
        return NextResponse.redirect(new URL(`${backPath}?error=missing_email`, req.nextUrl));
      }
      return NextResponse.json({ ok: false, error: "missing_email" }, { status: 400 });
    }

    const email = rawEmail.toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      if (wantsHtmlResponse(req)) {
        return NextResponse.redirect(new URL(`${backPath}?error=invalid_email`, req.nextUrl));
      }
      return NextResponse.json({ ok: false, error: "invalid_email" }, { status: 400 });
    }

    const tenant = isUuid(tenantParam)
      ? await prisma.tenant.findUnique({
          where: { id: tenantParam },
          select: { id: true, name: true, slug: true },
        })
      : await prisma.tenant.findUnique({
          where: { slug: tenantParam },
          select: { id: true, name: true, slug: true },
        });

    if (!tenant) {
      if (wantsHtmlResponse(req)) {
        return NextResponse.redirect(new URL(`${backPath}?error=tenant_not_found`, req.nextUrl));
      }
      return NextResponse.json({ ok: false, error: "tenant_not_found" }, { status: 404 });
    }

    const isSuperAdmin = !!ctx?.isSuperAdmin;
    const roles: any[] = Array.isArray(ctx?.user?.tenants) ? ctx.user.tenants : [];
    const canInviteForTenant =
      isSuperAdmin ||
      roles.some(
        (t: any) =>
          (t?.tenantId === tenant.id || t?.tenant_id === tenant.id) &&
          ["owner", "admin"].includes(String(t?.role || "").toLowerCase()),
      );

    if (!canInviteForTenant) {
      if (wantsHtmlResponse(req)) {
        return NextResponse.redirect(new URL(`${backPath}?error=forbidden`, req.nextUrl));
      }
      return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
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

        const { subject, html, text } = buildInviteEmail({
          recipientName: fullName || null,
          recipientEmail: email,
          tenantName: tenant.name,
          role,
          inviteUrl,
          personalMessage: message || null,
          expiresInDays: 7,
        });

        const sendRes = await resend.emails.send({
          from: resendFrom,
          to: [email],
          subject,
          html,
          text,
          reply_to: supportEmail,
        });

        emailStatus = "sent";
        console.log("Invite-admin: sent", { to: email, resendId: (sendRes as any)?.id });
      } catch (err: any) {
        emailStatus = "failed";
        emailErrorHint = String(err?.message || "send_failed").slice(0, 160);
        console.error("Invite-admin: resend send failed", err);
      }
    }

    // ✅ If this came from an HTML <form>, redirect back so your UI can show banners
    if (wantsHtmlResponse(req)) {
      const u = new URL(backPath, req.nextUrl);
      if (emailStatus === "sent" || emailStatus === "skipped") u.searchParams.set("invited", "1");
      else u.searchParams.set("error", "email_failed");
      return NextResponse.redirect(u);
    }

    return NextResponse.json({
      ok: true,
      inviteUrl,
      emailStatus,
      ...(emailErrorHint ? { emailErrorHint } : {}),
    });
  } catch (err) {
    console.error("Invite-admin: route crashed", err);

    if (wantsHtmlResponse(req)) {
      return NextResponse.redirect(new URL(`${backPath}?error=server_error`, req.nextUrl));
    }

    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
