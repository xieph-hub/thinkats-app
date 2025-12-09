// lib/requireOtp.ts
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { ServerUserContext } from "@/lib/auth/getServerUser";

const OTP_COOKIE_NAME = "thinkats_otp_verified";
const OTP_MAX_AGE_MINUTES = 60;

export async function ensureOtpVerified(userCtx: ServerUserContext | null) {
  // If we're not logged in, ATS is not accessible
  if (!userCtx) {
    redirect("/login");
  }

  const cookieStore = cookies();
  const raw = cookieStore.get(OTP_COOKIE_NAME)?.value;

  if (!raw) {
    redirect("/ats/verify");
  }

  const issuedAtMs = Number(raw);
  if (!Number.isFinite(issuedAtMs)) {
    redirect("/ats/verify");
  }

  const ageMs = Date.now() - issuedAtMs;
  const maxAgeMs = OTP_MAX_AGE_MINUTES * 60_000;

  if (ageMs > maxAgeMs) {
    redirect("/ats/verify");
  }

  // If we get here, OTP is fresh enough. Continue.
}
