// app/api/auth/otp/verify/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { OTP_COOKIE_NAME } from "@/lib/requireOtp";

export const runtime = "nodejs";

const AUTH_COOKIE_NAME = "thinkats_user_id";
const OTP_MAX_AGE_MINUTES = 60;

export async function POST(req: NextRequest) {
  try {
    const cookieStore = cookies();
    const userId = cookieStore.get(AUTH_COOKIE_NAME)?.value;

    if (!userId) {
      return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const code = typeof body?.code === "string" ? body.code.trim() : "";
    const returnToRaw = typeof body?.returnTo === "string" ? body.returnTo.trim() : "";

    if (!code) {
      return NextResponse.json({ ok: false, error: "missing_code" }, { status: 400 });
    }

    const now = new Date();

    const otp = await prisma.loginOtp.findFirst({
      where: { userId, code, consumed: false, expiresAt: { gt: now } },
      orderBy: { createdAt: "desc" },
    });

    if (!otp) {
      return NextResponse.json({ ok: false, error: "invalid_or_expired_code" }, { status: 400 });
    }

    await prisma.loginOtp.update({
      where: { id: otp.id },
      data: { consumed: true },
    });

    const safeReturnTo = returnToRaw.startsWith("/ats") ? returnToRaw : "/ats";

    const res = NextResponse.json({ ok: true, returnTo: safeReturnTo });

    res.cookies.set(OTP_COOKIE_NAME, "1", {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: OTP_MAX_AGE_MINUTES * 60,
    });

    return res;
  } catch (err) {
    console.error("OTP verify error", err);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
