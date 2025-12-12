// app/api/invites/accept/route.ts
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

// scrypt-based password hash without extra dependencies
async function hashPassword(password: string) {
  const salt = crypto.randomBytes(16);
  const derivedKey = await new Promise<Buffer>((resolve, reject) => {
    crypto.scrypt(password, salt, 64, { N: 16384, r: 8, p: 1 }, (err, key) => {
      if (err) reject(err);
      else resolve(key as Buffer);
    });
  });

  // format: scrypt$<saltB64>$<hashB64>
  return `scrypt$${salt.toString("base64")}$${derivedKey.toString("base64")}`;
}

export async function GET() {
  return NextResponse.json({ ok: false, error: "method_not_allowed" }, { status: 405 });
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      token?: string;
      fullName?: string | null;
      password?: string;
    };

    const token = String(body.token || "").trim();
    const password = String(body.password || "");

    if (!token) {
      return NextResponse.json({ ok: false, error: "missing_token" }, { status: 400 });
    }
    if (password.length < 10) {
      return NextResponse.json({ ok: false, error: "weak_password" }, { status: 400 });
    }

    const tokenHash = hashToken(token);

    const invite = await prisma.tenantInvitation.findFirst({
      where: {
        tokenHash,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      select: {
        id: true,
        email: true,
        role: true,
        tenantId: true,
      },
    });

    if (!invite) {
      return NextResponse.json({ ok: false, error: "invite_invalid_or_expired" }, { status: 404 });
    }

    // If user already exists and has a password, do NOT allow invite to reset it.
    const existing = await prisma.user.findUnique({
      where: { email: invite.email },
      select: { id: true, passwordHash: true },
    });

    if (existing?.passwordHash) {
      return NextResponse.json({ ok: false, error: "account_exists" }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const safeFullName = body.fullName ? String(body.fullName).trim() : null;

    const user =
      existing?.id
        ? await prisma.user.update({
            where: { id: existing.id },
            data: {
              passwordHash,
              ...(safeFullName ? { fullName: safeFullName } : {}),
            },
            select: { id: true, email: true },
          })
        : await prisma.user.create({
            data: {
              email: invite.email,
              fullName: safeFullName,
              passwordHash,
              globalRole: "USER",
              isActive: true,
            },
            select: { id: true, email: true },
          });

    // Ensure tenant role exists (avoid duplicates)
    const existingRole = await prisma.userTenantRole.findFirst({
      where: { userId: user.id, tenantId: invite.tenantId },
      select: { id: true },
    });

    if (!existingRole) {
      await prisma.userTenantRole.create({
        data: {
          userId: user.id,
          tenantId: invite.tenantId,
          role: invite.role,
          isPrimary: false,
        },
      });
    }

    // Consume invite
    await prisma.tenantInvitation.update({
      where: { id: invite.id },
      data: {
        usedAt: new Date(),
        userId: user.id,
      },
    });

    // Next: redirect them to login with email prefilled
    const next = `/login?email=${encodeURIComponent(invite.email)}&welcome=1`;

    return NextResponse.json({ ok: true, next });
  } catch (err) {
    console.error("POST /api/invites/accept failed", err);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
