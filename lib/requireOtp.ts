// lib/requireOtp.ts
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  AUTH_COOKIE_NAME,
  OTP_COOKIE_NAME,
} from "@/lib/auth/getServerUser";

export async function ensureOtpVerified(
  returnTo: string = "/ats",
): Promise<void> {
  const cookieStore = cookies();

  const userId = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!userId) {
    redirect(`/login?returnTo=${encodeURIComponent(returnTo)}`);
  }

  const otpVerified = cookieStore.get(OTP_COOKIE_NAME)?.value;
  if (!otpVerified) {
    redirect(`/ats/verify?returnTo=${encodeURIComponent(returnTo)}`);
  }
}
