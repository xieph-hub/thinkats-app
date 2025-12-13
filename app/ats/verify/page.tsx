// app/ats/verify/page.tsx
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { OTP_COOKIE_NAME } from "@/lib/requireOtp";
import { getServerUser } from "@/lib/auth/getServerUser";
import OtpVerifyForm from "./OtpVerifyForm";

export const metadata: Metadata = {
  title: "ThinkATS | Verify access",
  description: "Enter your one-time code to access the ATS workspace.",
};

export default async function VerifyOtpPage({
  searchParams,
}: {
  searchParams?: { returnTo?: string };
}) {
  const cookieStore = cookies();
  const alreadyOk = cookieStore.get(OTP_COOKIE_NAME)?.value === "1";

  const returnTo =
    searchParams?.returnTo && searchParams.returnTo.startsWith("/ats")
      ? searchParams.returnTo
      : "/ats";

  if (alreadyOk) redirect(returnTo);

  const ctx = await getServerUser();
  const email = ctx?.user?.email ?? undefined;

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            ThinkATS
          </p>
          <h1 className="text-xl font-semibold text-slate-900">
            Verify it&apos;s really you
          </h1>
          <p className="text-xs text-slate-600">
            Enter the one-time code sent to your email to continue.
          </p>
        </div>

        <OtpVerifyForm email={email} returnTo={returnTo} />
      </div>
    </main>
  );
}
