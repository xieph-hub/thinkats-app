// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getResourcinTenant } from "@/lib/tenant";
import bcrypt from "bcryptjs";

export const runtime = "nodejs";

const AUTH_COOKIE_NAME = "thinkats_user_id";
const OTP_COOKIE_NAME = "thinkats_otp_verified";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const emailRaw = body?.email as string | undefined;
    const passwordRaw = body?.password as string | undefined;

    if (!emailRaw || !passwordRaw) {
      return NextResponse.json(
        { ok: false, error: "missing_credentials" },
        { status: 400 },
      );
    }

    const email = emailRaw.trim().toLowerCase();
    const password = passwordRaw.trim();

    if (!email || !password) {
      return NextResponse.json(
        { ok: false, error: "missing_credentials" },
        { status: 400 },
      );
    }

    // Fetch default tenant (Resourcin) for auto-provisioning
    const defaultTenant = await getResourcinTenant();

    // Try find existing user
    let user = await prisma.user.findUnique({
      where: { email },
      include: {
        userTenantRoles: true,
      },
    });

    if (!user) {
      // Self-signup: create user + attach to default tenant
      const passwordHash = await bcrypt.hash(password, 10);

      user = await prisma.user.create({
        data: {
          email,
          fullName: null,
          passwordHash,
          globalRole: "USER",
          userTenantRoles: defaultTenant
            ? {
                create: {
                  tenantId: defaultTenant.id,
                  role: "owner",
                  isPrimary: true,
                },
              }
            : undefined,
        },
        include: {
          userTenantRoles: true,
        },
      });
    } else {
      // If user exists but passwordHash is empty, treat this as first-time set
      if (!user.passwordHash) {
        const passwordHash = await bcrypt.hash(password, 10);
        user = await prisma.user.update({
          where: { id: user.id },
          data: { passwordHash },
          include: { userTenantRoles: true },
        });
      } else {
        const match = await bcrypt.compare(password, user.passwordHash);
        if (!match) {
          return NextResponse.json(
            { ok: false, error: "invalid_credentials" },
            { status: 401 },
          );
        }
      }

      // If they somehow have no workspace yet, wire them to the default
      if (user.userTenantRoles.length === 0 && defaultTenant) {
        await prisma.userTenantRole.create({
          data: {
            userId: user.id,
            tenantId: defaultTenant.id,
            role: "owner",
            isPrimary: true,
          },
        });
      }
    }

    const res = NextResponse.json({ ok: true });

    // Main auth cookie
    res.cookies.set(AUTH_COOKIE_NAME, user.id, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    // Clear OTP state on fresh login
    res.cookies.set(OTP_COOKIE_NAME, "", {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    return res;
  } catch (err) {
    console.error("Login error", err);
    return NextResponse.json(
      { ok: false, error: "server_error" },
      { status: 500 },
    );
  }
}
