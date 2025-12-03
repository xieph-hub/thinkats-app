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
        { ok: false, error: "You need to sign in again before verifying a code." },
        { status: 401 },
      );
    }

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      // no-op, will fail on missing code
    }

    const rawCode = typeof body?.code === "string" ? body.code.trim() : "";
    const returnTo =
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

    if (!appUser || !appUser.otpCode || !appUser.otpExpiresAt) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "No active code found for this account. Please request a new code.",
        },
        { status: 400 },
      );
    }

    const now = new Date();

    if (appUser.otpCode !== rawCode) {
      return NextResponse.json(
        { ok: false, error: "The code you entered is incorrect." },
        { status: 400 },
      );
    }

    if (appUser.otpExpiresAt < now) {
      return NextResponse.json(
        { ok: false, error: "This code has expired. Please request a new one." },
        { status: 400 },
      );
    }

    // Mark OTP as used/verified
    await prisma.user.update({
      where: { id: appUser.id },
      data: {
        otpCode: null,
        otpExpiresAt: null,
        otpVerifiedAt: new Date(), // make sure this field exists in your schema if you want it
      },
    });

    const redirectTo = returnTo || "/ats";

    return NextResponse.json({ ok: true, redirectTo });
  } catch (err) {
    console.error("Error in /api/auth/otp/verify:", err);
    return NextResponse.json(
      {
        ok: false,
        error:
          "Something went wrong while verifying your code. Please try again.",
      },
      { status: 500 },
    );
  }
}
