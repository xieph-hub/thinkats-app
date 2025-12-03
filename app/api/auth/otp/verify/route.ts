// app/api/auth/otp/verify/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const OTP_COOKIE_NAME = "thinkats_otp_verified";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null) as
      | { code?: string }
      | null;

    const code = body?.code?.trim();

    if (!code || code.length !== 6) {
      return NextResponse.json(
        { ok: false, error: "Please enter the 6-digit code we emailed you." },
        { status: 400 },
      );
    }

    // Find a non-expired, non-consumed OTP with this code
    const now = new Date();

    const otp = await prisma.loginOtp.findFirst({
      where: {
        code,
        consumed: false,
        expiresAt: { gt: now },
      },
      include: {
        user: true,
      },
    });

    if (!otp || !otp.user) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "That code is invalid or has expired. Please request a new one.",
        },
        { status: 400 },
      );
    }

    // Mark it as consumed
    await prisma.loginOtp.update({
      where: { id: otp.id },
      data: { consumed: true },
    });

    // Mark this session as OTP-verified via cookie
    const res = NextResponse.json({ ok: true });

    // For now: 24h cookie, strict, sameSite=lax
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    res.cookies.set(OTP_COOKIE_NAME, "true", {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      expires,
    });

    return res;
  } catch (err) {
    console.error("[ThinkATS OTP] Verify error:", err);
    return NextResponse.json(
      {
        ok: false,
        error:
          "Something went wrong while checking your code. Please try again.",
      },
      { status: 500 },
    );
  }
}
