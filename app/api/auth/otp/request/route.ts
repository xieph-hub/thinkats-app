// app/api/auth/otp/request/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";

export const runtime = "nodejs";

const resend = new Resend(process.env.RESEND_API_KEY);

const AUTH_COOKIE_NAME = "thinkats_user_id";

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
        { ok: false, error: "unauthenticated" },
        { status: 401 },
      );
    }

    const email = user.email.toLowerCase();
    const code = generateOtpCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await prisma.loginOtp.create({
      data: {
        userId: user.id,
        code,
        expiresAt,
        consumed: false,
      },
    });

    try {
      await resend.emails.send({
        from: "ThinkATS <no-reply@thinkats.com>",
        to: email,
        subject: "Your ThinkATS verification code",
        html: `
          <p>Your ThinkATS verification code is:</p>
          <p style="font-size: 24px; font-weight: bold; letter-spacing: 0.2em;">
            ${code}
          </p>
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't try to sign in, you can ignore this email.</p>
        `,
      });
    } catch (err) {
      console.error("Failed to send OTP email", err);
      // Still return ok: true so we don't leak behaviour
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("OTP request error", err);
    return NextResponse.json(
      { ok: false, error: "server_error" },
      { status: 500 },
    );
  }
}
