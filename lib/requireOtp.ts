// lib/requireOtp.ts
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getServerUser } from "@/lib/supabaseServer";

/**
 * Server-side guard: make sure the logged-in Supabase user
 * has a recently verified OTP.
 *
 * Use only in server components / layouts.
 */
export async function ensureOtpVerified(returnTo: string = "/ats") {
  // 1) Get Supabase user via server-side helper
  const user = await getServerUser();

  // No Supabase session at all → go to login
  if (!user || !user.email) {
    redirect(`/login?callbackUrl=${encodeURIComponent(returnTo)}`);
  }

  const email = user.email.toLowerCase();

  // 2) Look up app-level User by email
  const appUser = await prisma.user.findUnique({
    where: { email },
  });

  // If there is no app-level user yet, treat it as “no OTP yet”
  // and force them through the OTP screen.
  if (!appUser) {
    redirect(`/auth/otp?returnTo=${encodeURIComponent(returnTo)}`);
  }

  // 3) Check for a recent, consumed OTP
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

    // No recent verified OTP → send to OTP page
    if (!lastOtp) {
      redirect(`/auth/otp?returnTo=${encodeURIComponent(returnTo)}`);
    }
  } catch (err: any) {
    console.error("[ThinkATS OTP] Error checking loginOtp:", err);

    // If the login_otps table doesn’t exist yet (P2021),
    // treat it as “OTP system not fully configured” and
    // TEMPORARILY let them through instead of crashing.
    // Once you’re sure the table exists, you can remove this.
    if (err?.code === "P2021") {
      console.warn(
        "[ThinkATS OTP] login_otps table missing; bypassing OTP check temporarily.",
      );
      return;
    }

    // For any other DB error, bubble up
    throw err;
  }
}
