// lib/requireOtp.ts
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createSupabaseRouteClient } from "@/lib/supabaseRouteClient";

/**
 * Server-side guard: make sure the logged-in user has passed OTP recently.
 * If not, redirect them to /auth/otp (or /auth/login if not signed in at all).
 *
 * Call this ONLY from server components / route handlers.
 */
export async function ensureOtpVerified(returnTo: string = "/ats") {
  // 1) Get Supabase user (primary auth)
  const supabase = createSupabaseRouteClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user || !user.email) {
    // Not logged in at all – send them to your main login page
    redirect(`/auth/login?returnTo=${encodeURIComponent(returnTo)}`);
  }

  const email = user.email.toLowerCase();

  // 2) Get app-level user
  const appUser = await prisma.user.findUnique({
    where: { email },
  });

  if (!appUser) {
    // No app user record – treat as not signed in properly
    redirect(`/auth/login?returnTo=${encodeURIComponent(returnTo)}`);
  }

  // 3) Check for a *recent* consumed OTP for this user
  //    (i.e. they have successfully verified a code within the last 24h)
  const now = new Date();
  const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24 hours

  const lastOtp = await prisma.loginOtp.findFirst({
    where: {
      userId: appUser.id,
      consumed: true,
      createdAt: { gt: cutoff }, // requires createdAt on loginOtp
    },
    orderBy: { createdAt: "desc" },
  });

  if (!lastOtp) {
    // No recent OTP verification – force them through the OTP screen
    const otpUrl = `/auth/otp?returnTo=${encodeURIComponent(returnTo)}`;
    redirect(otpUrl);
  }

  // If we get here, OTP is considered verified for this user in this window.
}
