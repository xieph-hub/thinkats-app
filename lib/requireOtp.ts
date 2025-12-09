// lib/requireOtp.ts
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const OTP_COOKIE_NAME = "thinkats_otp_ok";

export function ensureOtpVerified(callbackUrl: string) {
  const cookieStore = cookies();
  const flag = cookieStore.get(OTP_COOKIE_NAME)?.value;

  // If cookie is present, let the request pass
  if (flag === "1") {
    return;
  }

  // Otherwise, send the user to /ats/verify with the original callbackUrl
  const target = `/ats/verify?callbackUrl=${encodeURIComponent(callbackUrl)}`;
  redirect(target);
}
