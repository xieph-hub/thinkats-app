// app/api/ats/admin/tenant-invitations/route.ts
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.thinkats.com";

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { tenantId, email, role = "admin" } = body;

  // TODO: verify current user is SUPER_ADMIN

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) {
    return NextResponse.json(
      { ok: false, error: "Tenant not found" },
      { status: 404 },
    );
  }

  const token = crypto.randomUUID();
  const tokenHash = hashToken(token);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await prisma.tenantInvitation.create({
    data: {
      tenantId: tenant.id,
      email: email.toLowerCase(),
      role,
      tokenHash,
      expiresAt,
    },
  });

  const inviteUrl = `${siteUrl}/invites/${token}`;

  await resend.emails.send({
    from: "ThinkATS <no-reply@thinkats.com>",
    to: email,
    subject: `You’ve been invited to ThinkATS (${tenant.name})`,
    html: `
      <p>Hello,</p>
      <p>You’ve been invited to join the <strong>${tenant.name}</strong> workspace on ThinkATS.</p>
      <p><a href="${inviteUrl}">Click here to accept your invitation</a>.</p>
      <p>This link expires in 7 days.</p>
    `,
  });

  return NextResponse.json({ ok: true });
}
