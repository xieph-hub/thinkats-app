// app/ats/verify/page.tsx
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerUser } from "@/lib/auth/getServerUser";
import OtpVerifyForm from "./OtpVerifyForm";

export const metadata: Metadata = {
  title: "ThinkATS | Verify login",
  description:
    "Secure your ThinkATS ATS workspace with a one-time passcode (OTP).",
};

type VerifySearchParams = {
  returnTo?: string;
};

function sanitiseReturnTo(raw?: string): string {
  if (!raw) return "/ats";
  if (!raw.startsWith("/")) return "/ats";
  if (raw.startsWith("//")) return "/ats"; // avoid protocol-relative
  return raw;
}

export default async function AtsVerifyPage({
  searchParams,
}: {
  searchParams?: VerifySearchParams;
}) {
  const user = await getServerUser();

  // If not logged in at all, go back to password login
  if (!user) {
    const returnTo = sanitiseReturnTo(searchParams?.returnTo || "/ats");
    redirect(`/login?returnTo=${encodeURIComponent(returnTo)}`);
  }

  const email = (user as any).email ?? (user as any).primaryEmail ?? null;
  const safeReturnTo = sanitiseReturnTo(searchParams?.returnTo);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 bg-[radial-gradient(circle_at_top,_#172965_0,_transparent_60%),_radial-gradient(circle_at_bottom,_#64C247_0,_transparent_55%)] px-4">
      <div className="w-full max-w-md rounded-3xl bg-white/95 p-6 shadow-xl shadow-slate-900/20 backdrop-blur">
        <div className="mb-5 space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
            ThinkATS
          </p>
          <h1 className="text-xl font-semibold text-slate-900">
            Verify this login
          </h1>
          <p className="text-xs text-slate-600">
            Step 2 of 2. Enter the 6-digit code we sent to your email to unlock
            the ATS workspace on this device.
          </p>
          {email && (
            <p className="text-[11px] text-slate-500">
              Sending codes to{" "}
              <span className="font-medium text-slate-800">{email}</span>
            </p>
          )}
        </div>

        <OtpVerifyForm email={email ?? undefined} returnTo={safeReturnTo} />

        <p className="mt-4 text-center text-[11px] text-slate-400">
          If you didn&apos;t request this, you can simply close this window.
        </p>
      </div>
    </div>
  );
}
