// app/api/auth/otp/verify/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSupabaseRouteClient } from "@/lib/supabaseRouteClient";

export async function POST(req: NextRequest) {
  try {
    const supabase = createSupabaseRouteClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user || !user.email) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "You need to be signed in again before verifying a sign-in code.",
        },
        { status: 401 },
      );
    }

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      // ignore, we'll validate below
    }

    const rawCode =
      typeof body?.code === "string" ? body.code.trim() : "";
    const rawReturnTo =
      typeof body?.returnTo === "string" ? body.returnTo : null;

    if (!rawCode) {
      return NextResponse.json(
        { ok: false, error: "Code is required." },
        { status: 400 },
      );
    }

    const email = user.email.toLowerCase();

    const appUser = await prisma.user.findUnique({
      where: { email },
    });

    if (!appUser) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "We couldn’t find an account for this email. Please try signing in again.",
        },
        { status: 400 },
      );
    }

    const now = new Date();

    // Find the most recent matching, unconsumed, unexpired OTP
    const otpRecord = await prisma.loginOtp.findFirst({
      where: {
        userId: appUser.id,
        code: rawCode,
        consumed: false,
        expiresAt: { gt: now },
      },
      orderBy: { createdAt: "desc" }, // assumes you have createdAt
    });

    if (!otpRecord) {
      // You can choose to distinguish "expired" vs "invalid", but it's safer to merge for security
      return NextResponse.json(
        {
          ok: false,
          error:
            "This code is invalid or has expired. Please request a new code and try again.",
        },
        { status: 400 },
      );
    }

    // Mark OTP as consumed
    await prisma.loginOtp.update({
      where: { id: otpRecord.id },
      data: {
        consumed: true,
      },
    });

    // Optionally mark user as OTP-verified (if you have such a column)
    // Comment out if you don't have otpVerifiedAt on your User model.
    try {
      await prisma.user.update({
        where: { id: appUser.id },
        data: {
          otpVerifiedAt: new Date(),
        },
      });
    } catch (err) {
      // non-fatal; only warn
      console.warn(
        "[ThinkATS OTP] Could not set otpVerifiedAt on user:",
        err,
      );
    }

    // Basic protection against open redirects:
    // only allow internal paths starting with "/"
    let redirectTo = "/ats";
    if (rawReturnTo && rawReturnTo.startsWith("/")) {
      redirectTo = rawReturnTo;
    }

    return NextResponse.json({
      ok: true,
      redirectTo,
    });
  } catch (err) {
    console.error("[ThinkATS OTP] Verify error:", err);
    return NextResponse.json(
      {
        ok: false,
        error:
          "Something went wrong while verifying your code. Please request a new one and try again.",
      },
      { status: 500 },
    );
  }
}
