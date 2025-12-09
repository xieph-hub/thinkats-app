// app/api/auth/otp/verify/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const AUTH_COOKIE_NAME = "thinkats_user_id";
const OTP_COOKIE_NAME = "thinkats_otp_verified";
// How long an OTP verification is valid for ATS usage (in minutes)
const OTP_MAX_AGE_MINUTES = 60;

export async function POST(req: NextRequest) {
  try {
    const cookieStore = cookies();
    const userId = cookieStore.get(AUTH_COOKIE_NAME)?.value;

    if (!userId) {
      return NextResponse.json(
        { ok: false, error: "unauthenticated" },
        { status: 401 },
      );
    }

    const body = await req.json().catch(() => null);
    const codeRaw =
      typeof body?.code === "string" ? (body.code as string) : undefined;
    const callbackUrlRaw =
      typeof body?.callbackUrl === "string"
        ? (body.callbackUrl as string)
        : undefined;

    if (!codeRaw || !codeRaw.trim()) {
      return NextResponse.json(
        { ok: false, error: "missing_code" },
        { status: 400 },
      );
    }

    const code = codeRaw.trim();
    const now = new Date();

    const otp = await prisma.loginOtp.findFirst({
      where: {
        userId,
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

    // Mark OTP as consumed so it can't be reused
    await prisma.loginOtp.update({
      where: { id: otp.id },
      data: { consumed: true },
    });

    // Normalise callback URL (fallback to /ats)
    const callbackUrl =
      callbackUrlRaw && callbackUrlRaw.startsWith("/")
        ? callbackUrlRaw
        : "/ats";

    // Build response
    const res = NextResponse.json({
      ok: true,
      redirectTo: callbackUrl,
    });

    // Store timestamp in cookie so requireOtp can check freshness
    const issuedAt = Date.now().toString();

    res.cookies.set(OTP_COOKIE_NAME, issuedAt, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: OTP_MAX_AGE_MINUTES * 60, // seconds
    });

    return res;
  } catch (err) {
    console.error("OTP verify error", err);
    return NextResponse.json(
      { ok: false, error: "server_error" },
      { status: 500 },
    );
  }
}
