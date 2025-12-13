// app/api/ats/auth/me/route.ts
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServerUser } from "@/lib/auth/getServerUser";
import { isSuperAdminUser } from "@/lib/officialEmail";

const OTP_COOKIE_NAME = "thinkats_otp_ok";

export async function GET() {
  try {
    const ctx = await getServerUser();
    const cookieStore = cookies();

    const isOtpVerified = cookieStore.get(OTP_COOKIE_NAME)?.value === "1";

    // No app-level user (i.e. no thinkats_user_id cookie)
    if (!ctx || !ctx.user || !ctx.user.email) {
      return NextResponse.json({
        ok: false,
        email: null,
        isSuperAdmin: false,
        isOtpVerified,
      });
    }

    const email = ctx.user.email.toLowerCase();
    const isSuperAdmin = ctx.isSuperAdmin || isSuperAdminUser({ email });

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
