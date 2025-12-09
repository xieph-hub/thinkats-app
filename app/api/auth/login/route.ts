// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getResourcinTenant } from "@/lib/tenant";
import { isOfficialUser } from "@/lib/officialEmail";
import bcrypt from "bcryptjs";

const AUTH_COOKIE_NAME = "thinkats_user_id";

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

    // Try find existing user
    let user = await prisma.user.findUnique({
      where: { email },
      include: {
        userTenantRoles: true,
      },
    });

    const official = isOfficialUser ? isOfficialUser(email) : false;

    // 1) If user doesn't exist, auto-provision
    if (!user) {
      const passwordHash = await bcrypt.hash(password, 12);

      const globalRole = official ? "SUPER_ADMIN" : "USER";

      user = await prisma.user.create({
        data: {
          email,
          fullName: null,
          passwordHash,
          globalRole,
          isActive: true,
        },
        include: {
          userTenantRoles: true,
        },
      });

      // Attach to default Resourcin tenant as primary workspace
      try {
        const defaultTenant = await getResourcinTenant();
        if (defaultTenant) {
          await prisma.userTenantRole.create({
            data: {
              userId: user.id,
              tenantId: defaultTenant.id,
              role: official ? "owner" : "admin",
              isPrimary: true,
            },
          });
        }
      } catch (err) {
        console.error("Failed to attach new user to default tenant", err);
      }
    } else {
      // 2) Existing user: handle first-time password or validate existing password
      if (!user.isActive) {
        return NextResponse.json(
          { ok: false, error: "user_inactive" },
          { status: 403 },
        );
      }

      if (!user.passwordHash) {
        // First-time password set for an existing user:
        // accept this password once and set the hash.
        const passwordHash = await bcrypt.hash(password, 12);
        user = await prisma.user.update({
          where: { id: user.id },
          data: { passwordHash },
          include: { userTenantRoles: true },
        });
      } else {
        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) {
          return NextResponse.json(
            { ok: false, error: "invalid_credentials" },
            { status: 401 },
          );
        }
      }

      // Make sure the user has at least one tenant role.
      if (!user.userTenantRoles.length) {
        try {
          const defaultTenant = await getResourcinTenant();
          if (defaultTenant) {
            await prisma.userTenantRole.create({
              data: {
                userId: user.id,
                tenantId: defaultTenant.id,
                role: official ? "owner" : "admin",
                isPrimary: true,
              },
            });
          }
        } catch (err) {
          console.error("Failed to backfill tenant role for user", err);
        }
      }
    }

    // 3) Set auth cookie
    const res = NextResponse.json({ ok: true });

    res.cookies.set(AUTH_COOKIE_NAME, user.id, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 90, // 90 days
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
