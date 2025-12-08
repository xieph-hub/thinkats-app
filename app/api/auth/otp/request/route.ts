// app/api/auth/otp/request/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSupabaseRouteClient } from "@/lib/supabaseRouteClient";
import { isOfficialUser } from "@/lib/officialEmail";
import { Resend } from "resend";

const OTP_EXPIRY_MINUTES = 10;

const resendApiKey = process.env.RESEND_API_KEY;
const resendFrom = process.env.RESEND_FROM_EMAIL;
const resend =
  resendApiKey && resendFrom ? new Resend(resendApiKey) : null;

function generateOtpCode(): string {
  // 6-digit numeric OTP
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(_req: NextRequest) {
  try {
    const supabase = createSupabaseRouteClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user || !user.email) {
      return NextResponse.json(
        { ok: false, error: "unauthenticated" },
        { status: 401 },
      );
    }

    const email = user.email.toLowerCase();

    // Only send OTP to "official" / whitelisted emails
    if (!isOfficialUser({ email })) {
      return NextResponse.json(
        { ok: false, error: "email_not_allowed" },
        { status: 403 },
      );
    }

    // Ensure we have an app-level User row
    let appUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true, fullName: true },
    });

    if (!appUser) {
      appUser = await prisma.user.create({
        data: {
          email,
          fullName:
            (user.user_metadata as any)?.full_name ??
            (user.user_metadata as any)?.name ??
            null,
          globalRole: "USER",
        },
        select: { id: true, fullName: true },
      });
    }

    // Invalidate any existing unconsumed, unexpired OTPs
    await prisma.loginOtp.updateMany({
      where: {
        userId: appUser.id,
        consumed: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      data: {
        consumed: true,
      },
    });

    const code = generateOtpCode();
    const expiresAt = new Date(
      Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000,
    );

    await prisma.loginOtp.create({
      data: {
        userId: appUser.id,
        code,
        expiresAt,
        consumed: false,
      },
    });

    // Fire-and-forget email sending via Resend
    if (resend) {
      try {
        await resend.emails.send({
          from: resendFrom!,
          to: email,
          subject: "Your ThinkATS login code",
          text: `Your one-time code is ${code}. It expires in ${OTP_EXPIRY_MINUTES} minutes.`,
        });
      } catch (emailErr) {
        console.error("Error sending OTP email:", emailErr);
      }
    } else {
      console.warn(
        "RESEND_API_KEY or RESEND_FROM_EMAIL not configured. OTP email not sent.",
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("OTP request error:", err);
    return NextResponse.json(
      { ok: false, error: "internal_error" },
      { status: 500 },
    );
  }
}
