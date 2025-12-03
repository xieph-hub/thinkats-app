// app/api/auth/otp/verify/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSupabaseRouteClient } from "@/lib/supabaseRouteClient";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({} as any));
    const code = typeof body.code === "string" ? body.code.trim() : "";
    const returnTo =
      typeof body.returnTo === "string" && body.returnTo
        ? body.returnTo
        : "/ats";

    if (!code) {
      return NextResponse.json(
        { ok: false, error: "Please enter the 6-digit code." },
        { status: 400 },
      );
    }

    const supabase = createSupabaseRouteClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user || !user.email) {
      return NextResponse.json(
        {
          ok: false,
          error: "Your session expired. Please sign in again.",
        },
        { status: 401 },
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
          error: "We couldn't find a user record for this email.",
        },
        { status: 400 },
      );
    }

    const now = new Date();

    const otp = await prisma.loginOtp.findFirst({
      where: {
        userId: appUser.id,
        code,
        consumed: false,
        expiresAt: { gt: now },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!otp) {
      return NextResponse.json(
        {
          ok: false,
          error: "That code is invalid or has expired. Please request a new one.",
        },
        { status: 400 },
      );
    }

    await prisma.loginOtp.update({
      where: { id: otp.id },
      data: { consumed: true },
    });

    return NextResponse.json({
      ok: true,
      redirectTo: returnTo,
    });
  } catch (err) {
    console.error("[ThinkATS OTP] Verify error:", err);
    return NextResponse.json(
      {
        ok: false,
        error: "Something went wrong while verifying your code.",
      },
      { status: 500 },
    );
  }
}
