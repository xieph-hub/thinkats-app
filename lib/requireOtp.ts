// lib/requireOtp.ts
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const OTP_COOKIE_NAME = "thinkats_otp_verified";

export async function ensureOtpVerified(returnTo: string) {
  const cookieStore = cookies();
  const verified = cookieStore.get(OTP_COOKIE_NAME)?.value;

  if (verified === "true") {
    return;
  }

  // Not OTP-verified → send them to the OTP screen
  redirect(`/auth/otp?returnTo=${encodeURIComponent(returnTo)}`);
}
