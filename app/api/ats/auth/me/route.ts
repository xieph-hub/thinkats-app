// app/api/ats/auth/me/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSupabaseRouteClient } from "@/lib/supabaseRouteClient";
import { isSuperAdminUser } from "@/lib/officialEmail";

const OTP_COOKIE_NAME = "thinkats_otp_verified";

export async function GET(_req: NextRequest) {
  try {
    const supabase = createSupabaseRouteClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user || !user.email) {
      return NextResponse.json({
        ok: false,
        email: null,
        isSuperAdmin: false,
        isOtpVerified: false,
      });
    }

    const email = user.email.toLowerCase();
    const cookieStore = cookies();
    const otpCookie = cookieStore.get(OTP_COOKIE_NAME);
    const isOtpVerified = !!otpCookie?.value;
    const isSuperAdmin = isSuperAdminUser({ email });

    return NextResponse.json({
      ok: true,
      email,
      isSuperAdmin,
      isOtpVerified,
    });
  } catch (err) {
    console.error("auth/me error:", err);
    return NextResponse.json({
      ok: false,
      email: null,
      isSuperAdmin: false,
      isOtpVerified: false,
    });
  }
}
