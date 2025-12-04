// app/api/auth/otp/request/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSupabaseRouteClient } from "@/lib/supabaseRouteClient";
import { Resend } from "resend";
import { isOfficialUser } from "@/lib/officialEmail";

export const dynamic = "force-dynamic";

// Create a single Resend instance if we have an API key
const resend =
  process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

function generateOtpCode(): string {
  // 6-digit numeric OTP
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(_req: NextRequest) {
  try {
    // 1) Get current Supabase user
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

    // 2) Enforce "official email only"
    if (!isOfficialUser({ email: user.email })) {
      return NextResponse.json(
        {
          ok: false,
          error: "email_not_allowed",
          message:
            "This email address is not allowed to use ThinkATS. Please sign in with your official work email.",
        },
        { status: 403 },
      );
    }

    const email = user.email.toLowerCase();

    // 3) Ensure app-level User row exists
    let appUser = await prisma.user.findUnique({
      where: { email },
    });

    if (!appUser) {
      appUser = await prisma.user.create({
        data: {
          email,
          fullName:
            (user.user_metadata &&
              (user.user_metadata.full_name || user.user_metadata.name)) ||
            null,
          globalRole: "USER",
        },
      });
    }

    // 4) Invalidate any existing valid OTPs for this user
    await prisma.loginOtp.updateMany({
      where: {
        userId: appUser.id,
        consumed: false,
        expiresAt: { gt: new Date() },
      },
      data: {
        consumed: true,
      },
    });

    // 5) Create a fresh OTP
    const code = generateOtpCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await prisma.loginOtp.create({
      data: {
        userId: appUser.id,
        code,
        expiresAt,
      },
    });

    // 6) Send via Resend
    if (!resend || !process.env.RESEND_FROM_EMAIL) {
      console.warn(
        "[ThinkATS OTP] Missing RESEND config; OTP stored but no email sent.",
      );
    } else {
      try {
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL,
          to: email,
          subject: "Your ThinkATS login code",
          text: `Your ThinkATS login code is ${code}. It expires in 10 minutes.`,
          html: `
            <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 24px; color: #0f172a;">
              <h1 style="font-size: 20px; margin-bottom: 8px;">Your ThinkATS login code</h1>
              <p style="font-size: 14px; margin: 0 0 16px;">
                Use this one-time code to complete your sign in:
              </p>
              <p style="font-size: 32px; font-weight: 700; letter-spacing: 0.3em; margin: 0 0 16px;">
                ${code}
              </p>
              <p style="font-size: 12px; color: #64748b; margin: 0;">
                This code will expire in 10 minutes. If you didn’t request it, you can safely ignore this email.
              </p>
            </div>
          `,
        });
      } catch (err) {
        console.error("[ThinkATS OTP] Failed to send OTP email:", err);
        // OTP still exists in DB, so we don't hard-fail the request
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[ThinkATS OTP] Request error:", err);
    return NextResponse.json(
      { ok: false, error: "server_error" },
      { status: 500 },
    );
  }
}
