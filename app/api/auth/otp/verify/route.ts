// app/api/auth/otp/verify/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSupabaseRouteClient } from "@/lib/supabaseRouteClient";

export async function POST(req: NextRequest) {
  // Read body safely
  const body = await req.json().catch(() => ({} as any));
  const code = body.code as string | undefined;
  const next = body.next as string | undefined;

  if (!code || typeof code !== "string") {
    return NextResponse.json(
      { ok: false, error: "invalid_code" },
      { status: 400 },
    );
  }

  // 🔐 Get currently authenticated user from Supabase session
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

  // 🔎 Look up OTP record (this expects you to have the OtpToken model in Prisma)
  const otp = await prisma.otpToken.findFirst({
    where: {
      email,
      code,
      expiresAt: { gt: new Date() },
      usedAt: null,
    },
  });

  if (!otp) {
    return NextResponse.json(
      { ok: false, error: "invalid_or_expired" },
      { status: 400 },
    );
  }

  // Mark it as used (so each code is one-time)
  await prisma.otpToken.update({
    where: { id: otp.id },
    data: { usedAt: new Date() },
  });

  // Decide where to send them after OTP
  const redirectTo =
    typeof next === "string" && next.startsWith("/") ? next : "/ats";

  // ✅ Mark OTP as satisfied for this browser (cookie is what ensureOtpVerified checks)
  const res = NextResponse.json({ ok: true, redirectTo });

  res.cookies.set("thinkats_otp_verified", "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 60 * 60 * 8, // 8 hours
  });

  return res;
}
