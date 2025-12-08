// app/ats/verify/page.tsx
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerUser } from "@/lib/auth/getServerUser";
import VerifyOtpClient from "./VerifyOtpClient";

export const metadata: Metadata = {
  title: "ThinkATS | Verify login",
  description: "Verify your one-time code to unlock the ATS workspace.",
};

type VerifyPageProps = {
  searchParams?: {
    callbackUrl?: string;
  };
};

export default async function VerifyOtpPage({
  searchParams,
}: VerifyPageProps) {
  const { supabaseUser } = await getServerUser();

  if (!supabaseUser || !supabaseUser.email) {
    redirect("/login?callbackUrl=/ats");
  }

  const email = supabaseUser.email;

  const callbackUrl = searchParams?.callbackUrl || "/ats";

  const [localPart, domain] = email.split("@");
  const maskedLocal =
    localPart.length <= 2
      ? `${localPart[0] ?? ""}••`
      : `${localPart[0]}•••${localPart.slice(-1)}`;
  const maskedEmail = domain ? `${maskedLocal}@${domain}` : email;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="w-full max-w-md rounded-2xl bg-slate-900/80 border border-slate-800 px-6 py-8 shadow-xl">
        <div className="mb-6 space-y-2 text-center">
          <h1 className="text-xl font-semibold text-slate-50">
            Verify your login
          </h1>
          <p className="text-sm text-slate-400">
            We&apos;ve sent a one-time code to
            <br />
            <span className="font-medium text-slate-100">
              {maskedEmail}
            </span>
          </p>
        </div>

        <VerifyOtpClient callbackUrl={callbackUrl} />

        <p className="mt-6 text-center text-xs text-slate-500">
          If the email doesn&apos;t arrive after a few minutes, check your
          spam folder or request a new code.
        </p>
      </div>
    </div>
  );
}
