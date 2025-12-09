// lib/requireOtp.ts
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const OTP_COOKIE_NAME = "thinkats_otp_verified";

/**
 * Server-side OTP gate for ATS.
 *
 * - Checks for the `thinkats_otp_verified` cookie.
 * - If missing/falsey, redirects to /ats/verify with an optional callbackUrl.
 * - Intended to be used in server components/layouts:
 *     await ensureOtpVerified("/ats");
 *     await ensureOtpVerified("/ats/tenants");
 */
export async function ensureOtpVerified(
  callbackUrl: string = "/ats",
): Promise<void> {
  const cookieStore = cookies();
  const flag = cookieStore.get(OTP_COOKIE_NAME)?.value;

  // If already verified in this browser, allow through
  if (flag === "true") {
    return;
  }

  const params = new URLSearchParams();
  if (callbackUrl) {
    params.set("callbackUrl", callbackUrl);
  }

  redirect(`/ats/verify?${params.toString()}`);
}
