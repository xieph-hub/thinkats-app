// app/api/auth/password/reset/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const runtime = "nodejs";

const AUTH_COOKIE_NAME = "thinkats_user_id";
const OTP_COOKIE_NAME = "thinkats_otp_verified";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    const emailRaw = body?.email as string | undefined;
    const codeRaw = body?.code as string | undefined;
    const passwordRaw = body?.password as string | undefined;

    if (!emailRaw || !codeRaw || !passwordRaw) {
      return NextResponse.json(
        { ok: false, error: "missing_fields" },
        { status: 400 },
      );
    }

    const email = emailRaw.trim().toLowerCase();
    const code = codeRaw.trim();
    const password = passwordRaw.trim();

    if (!email || !code || !password) {
      return NextResponse.json(
        { ok: false, error: "missing_fields" },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Keep responses generic so we don't leak exact reason
    if (!user) {
      return NextResponse.json(
        { ok: false, error: "invalid_or_expired_code" },
        { status: 400 },
      );
    }

    const now = new Date();

    const otp = await prisma.loginOtp.findFirst({
      where: {
        userId: user.id,
        code,
        consumed: false,
        expiresAt: {
          gt: now,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!otp) {
      return NextResponse.json(
        { ok: false, error: "invalid_or_expired_code" },
        { status: 400 },
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await prisma.$transaction([
      prisma.loginOtp.update({
        where: { id: otp.id },
        data: { consumed: true },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      }),
    ]);

    const res = NextResponse.json({ ok: true });

    // Log them in immediately
    res.cookies.set(AUTH_COOKIE_NAME, user.id, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    // Clear OTP state; they'll re-verify when needed
    res.cookies.set(OTP_COOKIE_NAME, "", {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    return res;
  } catch (err) {
    console.error("Password reset error", err);
    return NextResponse.json(
      { ok: false, error: "server_error" },
      { status: 500 },
    );
  }
}
