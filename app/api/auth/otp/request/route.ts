// app/api/auth/otp/request/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import { AUTH_COOKIE_NAME } from "@/lib/auth/getServerUser";

const resend = new Resend(process.env.RESEND_API_KEY);

function generateOtpCode(): string {
  // 6-digit numeric OTP
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(_req: NextRequest) {
  try {
    const cookieStore = cookies();
    const userId = cookieStore.get(AUTH_COOKIE_NAME)?.value;

    if (!userId) {
      return NextResponse.json(
        { ok: false, error: "unauthenticated" },
        { status: 401 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.email) {
      return NextResponse.json(
        { ok: false, error: "user_not_found" },
        { status: 400 },
      );
    }

    const now = new Date();

    // 🔁 Invalidate any existing active OTPs
    await prisma.loginOtp.updateMany({
      where: {
        userId,
        consumed: false,
        expiresAt: { gt: now },
      },
      data: {
        consumed: true,
      },
    });

    const code = generateOtpCode();
    const expiresAt = new Date(now.getTime() + 10 * 60 * 1000); // 10 mins

    await prisma.loginOtp.create({
      data: {
        userId,
        code,
        expiresAt,
      },
    });

    const from =
      process.env.ATS_OTP_FROM_EMAIL ??
      "ThinkATS <no-reply@thinkats.com>";

    await resend.emails.send({
      from,
      to: user.email,
      subject: "Your ThinkATS login code",
      text: `Your ThinkATS one-time code is ${code}. It expires in 10 minutes.`,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("OTP request failed:", err);
    return NextResponse.json(
      { ok: false, error: "server_error" },
      { status: 500 },
    );
  }
}
