// app/api/auth/password/request/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";

export const runtime = "nodejs";

const resend = new Resend(process.env.RESEND_API_KEY);

function generateOtpCode(): string {
  // 6-digit numeric reset code
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const emailRaw = body?.email as string | undefined;
    if (!emailRaw) {
      return NextResponse.json(
        { ok: false, error: "missing_email" },
        { status: 400 },
      );
    }

    const email = emailRaw.trim().toLowerCase();
    if (!email) {
      return NextResponse.json(
        { ok: false, error: "missing_email" },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Always respond 200 to avoid leaking which emails exist.
    if (!user) {
      return NextResponse.json({ ok: true });
    }

    const code = generateOtpCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    await prisma.loginOtp.create({
      data: {
        userId: user.id,
        code,
        expiresAt,
        consumed: false,
      },
    });

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL || "https://www.thinkats.com";
    const baseUrl = siteUrl.replace(/\/$/, "");
    const resetUrl = `${baseUrl}/reset-password?email=${encodeURIComponent(
      email,
    )}&code=${encodeURIComponent(code)}`;

    try {
      await resend.emails.send({
        from: "ThinkATS <no-reply@thinkats.com>",
        to: email,
        subject: "Reset your ThinkATS password",
        html: `
          <p>We received a request to reset your ThinkATS password.</p>
          <p>Your reset code is:</p>
          <p style="font-size: 24px; font-weight: bold; letter-spacing: 0.2em;">
            ${code}
          </p>
          <p>You can also reset directly using this link:</p>
          <p><a href="${resetUrl}">${resetUrl}</a></p>
          <p>This code will expire in 15 minutes. If you didn't request this, you can ignore this email.</p>
        `,
      });
    } catch (err) {
      console.error("Failed to send password reset email", err);
      // Still return ok: true so the UI doesn't leak info
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Password reset request error", err);
    return NextResponse.json(
      { ok: false, error: "server_error" },
      { status: 500 },
    );
  }
}
