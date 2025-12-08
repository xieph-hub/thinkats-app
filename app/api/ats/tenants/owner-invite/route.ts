// app/api/ats/tenants/owner-invite/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerUser } from "@/lib/auth/getServerUser";
import crypto from "crypto";
import { Resend } from "resend";

export const dynamic = "force-dynamic";

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

type OwnerInvitePayload = {
  tenantId: string;
  email: string;
  role?: string; // "owner" | "admin" | "recruiter" | "viewer"
};

function normaliseEmail(email: string) {
  return email.trim().toLowerCase();
}

function generateToken() {
  return crypto.randomBytes(32).toString("hex");
}

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await getServerUser();

    // 🔐 Only SUPER_ADMIN should be allowed to invite owners from this endpoint
    if (!ctx || !ctx.isSuperAdmin) {
      return NextResponse.json(
        { ok: false, error: "Forbidden: super admin only." },
        { status: 403 },
      );
    }

    const body = (await req.json()) as OwnerInvitePayload;
    const tenantId = body.tenantId?.trim();
    const email = body.email?.trim();
    const role = body.role || "owner";

    if (!tenantId || !email) {
      return NextResponse.json(
        { ok: false, error: "tenantId and email are required." },
        { status: 400 },
      );
    }

    // Ensure tenant exists
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      return NextResponse.json(
        { ok: false, error: "Tenant not found." },
        { status: 404 },
      );
    }

    const normalisedEmail = normaliseEmail(email);

    // Look up an existing user (if they already have a ThinkATS account)
    const existingUser = await prisma.user.findUnique({
      where: { email: normalisedEmail },
    });

    // Generate invite token → hash for DB
    const token = generateToken();
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Create TenantInvitation row
    const invitation = await prisma.tenantInvitation.create({
      data: {
        tenantId: tenant.id,
        userId: existingUser?.id ?? null,
        email: normalisedEmail,
        role,
        tokenHash,
        expiresAt,
      },
    });

    // Fire-and-forget email via Resend (if configured)
    if (resend) {
      try {
        const baseUrl =
          process.env.NEXT_PUBLIC_SITE_URL || "https://www.thinkats.com";

        const acceptUrl = `${baseUrl}/tenants/invite/accept?token=${encodeURIComponent(
          token,
        )}`;

        await resend.emails.send({
          from: "ThinkATS <no-reply@thinkats.com>",
          to: normalisedEmail,
          subject: `You’ve been invited to ${tenant.name} on ThinkATS`,
          html: `
            <p>Hi,</p>
            <p>You’ve been invited as <strong>${role}</strong> to the workspace <strong>${tenant.name}</strong> on ThinkATS.</p>
            <p>
              <a href="${acceptUrl}">Accept your invitation</a>
            </p>
            <p>If you weren’t expecting this email, you can safely ignore it.</p>
          `,
        });
      } catch (err) {
        console.error("Failed to send owner invite email", err);
        // Don’t fail the API on email send issues – you can add a resend flow later.
      }
    }

    return NextResponse.json(
      {
        ok: true,
        invitationId: invitation.id,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/ats/tenants/owner-invite error", error);
    return NextResponse.json(
      { ok: false, error: "Failed to create owner invitation." },
      { status: 500 },
    );
  }
}
