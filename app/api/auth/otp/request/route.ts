// app/api/auth/otp/request/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSupabaseRouteClient } from "@/lib/supabaseRouteClient";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

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
      console.error("OTP request unauthenticated:", userError);
      return NextResponse.json(
        { ok: false, error: "unauthenticated" },
        { status: 401 },
      );
    }

    const email = user.email.toLowerCase();

    // 1) Find or create app-level User row
    let appUser = await prisma.user.findUnique({
      where: { email },
    });

    if (!appUser) {
      appUser = await prisma.user.create({
        data: {
          email,
          supabaseUserId: user.id,
        },
      });
    } else if (!appUser.supabaseUserId) {
      // Backfill supabaseUserId if missing
      appUser = await prisma.user.update({
        where: { id: appUser.id },
        data: { supabaseUserId: user.id },
      });
    }

    // 2) Invalidate previous active OTPs
    await prisma.otpCode.updateMany({
      where: {
        userId: appUser.id,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      data: {
        usedAt: new Date(),
      },
    });

    // 3) Create new OTP
    const code = generateOtpCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    await prisma.otpCode.create({
      data: {
        userId: appUser.id,
        code,
        expiresAt,
      },
    });

    // 4) Send email
    const from =
      process.env.ATS_OTP_FROM_EMAIL ??
      "ThinkATS <no-reply@thinkats.com>";

    await resend.emails.send({
      from,
      to: email,
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
