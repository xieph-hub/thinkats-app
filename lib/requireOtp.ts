// lib/requireOtp.ts
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const OTP_COOKIE_NAME = "thinkats_otp_verified";

export function ensureOtpVerified(callbackUrl: string) {
  const flag = cookies().get(OTP_COOKIE_NAME)?.value;

  if (flag === "1") return;

  const safeCallback =
    callbackUrl && callbackUrl.startsWith("/ats") ? callbackUrl : "/ats";

  redirect(`/ats/verify?returnTo=${encodeURIComponent(safeCallback)}`);
}
