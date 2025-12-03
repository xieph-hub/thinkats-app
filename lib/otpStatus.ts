// lib/otpStatus.ts
import { prisma } from "@/lib/prisma";

const OTP_WINDOW_MS = 24 * 60 * 60 * 1000; // 24h

export async function getOtpVerifiedForEmail(
  email: string | null | undefined,
): Promise<boolean> {
  if (!email) return false;

  const normalisedEmail = email.toLowerCase();

  const appUser = await prisma.user.findUnique({
    where: { email: normalisedEmail },
  });

  if (!appUser) {
    return false;
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

  return !!lastOtp;
}
