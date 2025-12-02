// app/api/auth/otp/verify/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabaseRouteClient";
import { prisma } from "@/lib/prisma";
import { hashOtpCode } from "@/lib/otp";

const OTP_COOKIE_NAME = "thinkats_otp_verified";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { code } = body as { code?: string };

  if (!code || code.trim().length !== 6) {
    return NextResponse.json(
      { error: "Enter the 6-digit code from your email." },
      { status: 400 }
    );
  }

  const { supabase, res } = createSupabaseRouteClient(req);
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 }
    );
  }

  const userId = user.id;
  const now = new Date();
  const codeHash = hashOtpCode(code.trim());

  const otpRecord = await prisma.atsLoginOtp.findFirst({
    where: {
      userId,
      codeHash,
      usedAt: null,
      expiresAt: { gt: now },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!otpRecord) {
    return NextResponse.json(
      { error: "Invalid or expired code. Request a new one." },
      { status: 400 }
    );
  }

  await prisma.atsLoginOtp.update({
    where: { id: otpRecord.id },
    data: { usedAt: now },
  });

  // Set a cookie that tells ATS pages "OTP passed"
  const response = NextResponse.json(
    { ok: true },
    {
      status: 200,
    }
  );

  // Copy Supabase cookies
  res.cookies.getAll().forEach((cookie) => {
    response.cookies.set(cookie);
  });

  // Our own OTP verification cookie (7 days; adjust as you like)
  response.cookies.set(OTP_COOKIE_NAME, "1", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    sameSite: "lax",
  });

  return response;
}
