// lib/requireOtp.ts
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getServerUser } from "@/lib/auth/getServerUser";

export async function ensureOtpVerified(
  returnTo: string = "/ats",
): Promise<void> {
  const authUser = await getServerUser();

  if (!authUser || !authUser.email) {
    redirect(`/login?returnTo=${encodeURIComponent(returnTo)}`);
  }

  const email = authUser.email.toLowerCase();

  const appUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true, otpVerifiedAt: true },
  });

  if (!appUser || !appUser.otpVerifiedAt) {
    redirect(`/ats/verify?returnTo=${encodeURIComponent(returnTo)}`);
  }
}
