// app/api/auth/otp/request/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";

export const runtime = "nodejs";

const resend = new Resend(process.env.RESEND_API_KEY);

const AUTH_COOKIE_NAME = "thinkats_user_id";

function generateOtpCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(_req: NextRequest) {
  try {
    const userId = cookies().get(AUTH_COOKIE_NAME)?.value?.trim();
    if (!userId) {
      return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, isActive: true },
    });

    if (!user?.isActive || !user.email) {
      return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 });
    }

    const code = generateOtpCode();

    // ✅ Server time is UTC — universal. Store expiresAt from server time only.
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
    const created = await prisma.loginOtp.create({
      data: {
        userId: user.id,
        code,
        expiresAt,
        consumed: false,
      },
      select: { id: true },
    });

    // Send email
    await resend.emails.send({
      from: "ThinkATS <no-reply@thinkats.com>",
      to: user.email,
      subject: "Your ThinkATS verification code",
      text: `Your verification code is: ${code}\n\nThis code expires in 10 minutes.`,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("OTP request error:", err);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
