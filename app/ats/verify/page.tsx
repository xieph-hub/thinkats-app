// app/ats/verify/page.tsx
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerUser } from "@/lib/auth/getServerUser";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ThinkATS | Verify login",
  description: "Secure OTP verification step before accessing the ATS workspace.",
};

type VerifyPageProps = {
  searchParams?: {
    callbackUrl?: string | string[];
  };
};

function normaliseCallbackUrl(raw: string | string[] | undefined): string {
  if (!raw) return "/ats";
  if (Array.isArray(raw)) return raw[0] || "/ats";
  // Only allow internal redirects for safety
  if (!raw.startsWith("/")) return "/ats";
  return raw;
}

export default async function VerifyPage({ searchParams }: VerifyPageProps) {
  const ctx = await getServerUser();

  // Require app-level user (driven by thinkats_user_id cookie)
  if (!ctx || !ctx.user.email) {
    redirect("/login?callbackUrl=/ats");
  }

  const email = ctx.user.email;
  const callbackUrl = normaliseCallbackUrl(searchParams?.callbackUrl);

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/90 p-8 shadow-xl">
        <h1 className="text-xl font-semibold text-slate-50 mb-2">
          Verify it&apos;s really you
        </h1>
        <p className="text-sm text-slate-300 mb-6">
          We&apos;ve sent a one-time code to{" "}
          <span className="font-mono text-slate-100">{email}</span>. Enter it
          below to continue to your ATS workspace.
        </p>

        <form
          className="space-y-4"
          method="POST"
          action="/api/auth/otp/verify"
        >
          <input type="hidden" name="callbackUrl" value={callbackUrl} />

          <div>
            <label
              htmlFor="code"
              className="block text-sm font-medium text-slate-200 mb-1"
            >
              6-digit code
            </label>
            <input
              id="code"
              name="code"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              required
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-center text-lg tracking-[0.35em] font-mono text-slate-100 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-sky-500 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-sky-400 transition-colors"
          >
            Verify &amp; continue
          </button>

          <p className="text-xs text-slate-400 text-center">
            If you didn&apos;t get a code, wait a minute and try again, or sign
            out and sign back in to trigger a new OTP.
          </p>
        </form>
      </div>
    </main>
  );
}
