// lib/otpStatus.ts
import { prisma } from "@/lib/prisma";
import { getServerUser } from "@/lib/supabaseServer";

const OTP_WINDOW_MS = 24 * 60 * 60 * 1000; // 24h

/**
 * Used on the marketing layout/header so we can decide
 * whether to show "Logged in" or "Finish sign-in".
 */
export async function getOtpStatusForCurrentUser() {
  const user = await getServerUser();

  // No Supabase session at all
  if (!user || !user.email) {
    return {
      hasSession: false,
      otpVerified: false,
      email: null as string | null,
    };
  }

  const email = user.email.toLowerCase();

  const appUser = await prisma.user.findUnique({
    where: { email },
  });

  // No app user → treat as not OTP-verified
  if (!appUser) {
    return {
      hasSession: true,
      otpVerified: false,
      email,
    };
  }

  const cutoff = new Date(Date.now() - OTP_WINDOW_MS);

  const lastOtp = await prisma.loginOtp.findFirst({
    where: {
      userId: appUser.id,
      consumed: true,
      createdAt: { gt: cutoff },
    },
    orderBy: { createdAt: "desc" },
  });

  return {
    hasSession: true,
    otpVerified: !!lastOtp,
    email,
  };
}
