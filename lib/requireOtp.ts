// lib/requireOtp.ts
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const OTP_COOKIE_NAME = "thinkats_otp_ok";

export function ensureOtpVerified(callbackUrl: string) {
  const cookieStore = cookies();
  const flag = cookieStore.get(OTP_COOKIE_NAME)?.value;

  if (flag === "1") return;

  const safeCallback =
    callbackUrl && callbackUrl.startsWith("/ats") ? callbackUrl : "/ats";

  redirect(`/ats/verify?returnTo=${encodeURIComponent(safeCallback)}`);
}
