// app/api/otp/verify/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSupabaseRouteClient } from "@/lib/supabaseRouteClient";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
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

    const body = (await req.json().catch(() => null)) as
      | { code?: string | null }
      | null;

    const code = body?.code?.toString().trim();

    if (!code) {
      return NextResponse.json(
        { ok: false, error: "missing_code" },
        { status: 400 },
      );
    }

    const email = user.email.toLowerCase();

    const appUser = await prisma.user.findUnique({
      where: { email },
    });

    if (!appUser) {
      return NextResponse.json(
        { ok: false, error: "user_not_found" },
        { status: 404 },
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
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!otp) {
      return NextResponse.json(
        { ok: false, error: "invalid_or_expired" },
        { status: 400 },
      );
    }

    await prisma.loginOtp.update({
      where: { id: otp.id },
      data: { consumed: true },
    });

    // mark session as OTP-verified via cookie
    const res = NextResponse.json({ ok: true });

    res.cookies.set("thinkats_otp_verified", "true", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60, // 1 hour
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
