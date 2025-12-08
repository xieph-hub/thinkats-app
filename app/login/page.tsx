// app/login/page.tsx
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Sign in | ThinkATS",
  description: "Sign in to your ThinkATS workspace.",
};

type PageProps = {
  searchParams?: {
    callbackUrl?: string;
    error?: string;
  };
};

export default function LoginPage({ searchParams }: PageProps) {
  const callbackUrl =
    typeof searchParams?.callbackUrl === "string" &&
    searchParams.callbackUrl.length > 0
      ? searchParams.callbackUrl
      : "/ats";

  const errorCode =
    typeof searchParams?.error === "string"
      ? searchParams.error
      : "";

  let errorMessage = "";
  if (errorCode === "missing_email") {
    errorMessage = "Please enter your work email.";
  } else if (errorCode === "inactive") {
    errorMessage =
      "This account has been deactivated. Contact support if you think this is a mistake.";
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950/80 p-6 shadow-[0_18px_45px_rgba(15,23,42,0.85)]">
        <div className="mb-6 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            ThinkATS
          </p>
          <h1 className="text-xl font-semibold text-slate-50">
            Sign in to your ATS workspace
          </h1>
          <p className="text-xs text-slate-400">
            Use the same email you use with Resourcin / ThinkATS.
          </p>
        </div>

        {errorMessage && (
          <div className="mb-4 rounded-lg border border-rose-500/40 bg-rose-950/40 px-3 py-2 text-[11px] text-rose-100">
            {errorMessage}
          </div>
        )}

        <form
          method="POST"
          action="/api/auth/login"
          className="space-y-4"
        >
          <input
            type="hidden"
            name="callbackUrl"
            value={callbackUrl}
          />

          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="block text-[11px] font-medium text-slate-100"
            >
              Work email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="block w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-50 outline-none ring-0 placeholder:text-slate-500 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-500/60"
              placeholder="you@company.com"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="name"
              className="block text-[11px] font-medium text-slate-100"
            >
              Full name (optional)
            </label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              className="block w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-50 outline-none ring-0 placeholder:text-slate-500 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-500/60"
              placeholder="Helps us label your user record"
            />
          </div>

          <button
            type="submit"
            className="mt-2 inline-flex w-full items-center justify-center rounded-md bg-indigo-500 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-400"
          >
            Continue to ATS
          </button>
        </form>

        <p className="mt-6 text-[10px] text-slate-500">
          By signing in, you agree to the{" "}
          <Link
            href="/legal/terms"
            className="text-slate-300 underline-offset-2 hover:underline"
          >
            Terms
          </Link>{" "}
          and{" "}
          <Link
            href="/legal/privacy"
            className="text-slate-300 underline-offset-2 hover:underline"
          >
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
