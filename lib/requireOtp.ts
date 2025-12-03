// lib/requireOtp.ts
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getServerUser } from "@/lib/supabaseServer";

/**
 * Server-side guard: enforce that the current Supabase user
 * has a recently verified OTP before accessing /ats.
 */
export async function ensureOtpVerified(returnTo: string = "/ats") {
  // 1) Must have a Supabase user session
  const user = await getServerUser();

  if (!user || !user.email) {
    redirect(`/login?callbackUrl=${encodeURIComponent(returnTo)}`);
  }

  const email = user.email.toLowerCase();

  // 2) Look up app-level User by email
  const appUser = await prisma.user.findUnique({
    where: { email },
  });

  // If we don't even have an app user yet, they definitely haven't done OTP
  if (!appUser) {
    redirect(`/auth/otp?returnTo=${encodeURIComponent(returnTo)}`);
  }

  // 3) Enforce: must have a recent, consumed OTP
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // last 24h

  try {
    const lastOtp = await prisma.loginOtp.findFirst({
      where: {
        userId: appUser.id,
        consumed: true,
        createdAt: { gt: cutoff },
      },
      orderBy: { createdAt: "desc" },
    });

    // No valid OTP → send to OTP page
    if (!lastOtp) {
      redirect(`/auth/otp?returnTo=${encodeURIComponent(returnTo)}`);
    }
  } catch (err) {
    console.error("[ThinkATS OTP] Error while checking loginOtp:", err);

    // Hard rule: if OTP check fails for ANY reason, do NOT allow ATS access.
    // Redirect them to /auth/otp so you never silently skip the second factor.
    redirect(`/auth/otp?returnTo=${encodeURIComponent(returnTo)}`);
  }
}
