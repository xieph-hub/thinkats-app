// app/api/auth/otp/verify/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSupabaseRouteClient } from "@/lib/supabaseRouteClient";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({} as any));
    const code = body.code as string | undefined;
    const next = body.next as string | undefined;

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { ok: false, error: "invalid_code" },
        { status: 400 },
      );
    }

    // 1) Get current Supabase user
    const supabase = createSupabaseRouteClient(req);

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

    // 2) Find app-level User for this email
    const appUser = await prisma.user.findUnique({
      where: { email },
    });

    if (!appUser) {
      return NextResponse.json(
        { ok: false, error: "app_user_not_found" },
        { status: 403 },
      );
    }

    // 3) Find matching, active OTP
    const otp = await prisma.loginOtp.findFirst({
      where: {
        userId: appUser.id,
        code,
        consumed: false,
        expiresAt: { gt: new Date() },
      },
    });

    if (!otp) {
      return NextResponse.json(
        { ok: false, error: "invalid_or_expired" },
        { status: 400 },
      );
    }

    // 4) Mark OTP as consumed
    await prisma.loginOtp.update({
      where: { id: otp.id },
      data: { consumed: true },
    });

    // 5) Decide redirect destination after OTP
    const redirectTo =
      typeof next === "string" && next.startsWith("/") ? next : "/ats";

    // 6) Mark OTP as satisfied via cookie (this is what ensureOtpVerified checks)
    const res = NextResponse.json({ ok: true, redirectTo });

    res.cookies.set("thinkats_otp_verified", "1", {
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/",
      maxAge: 60 * 60 * 8, // 8 hours
    });

    return res;
  } catch (err) {
    console.error("[ThinkATS OTP] Verify error:", err);
    return NextResponse.json(
      { ok: false, error: "server_error" },
      { status: 500 },
    );
  }
}
