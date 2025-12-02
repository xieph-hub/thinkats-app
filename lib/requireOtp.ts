// lib/requireOtp.ts
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const OTP_COOKIE_NAME = "thinkats_otp_verified";

export function ensureOtpVerified() {
  const store = cookies();
  const cookie = store.get(OTP_COOKIE_NAME);

  if (!cookie || cookie.value !== "1") {
    redirect("/ats/verify");
  }
}
