// app/login/page.tsx
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Sign in | ThinkATS",
};

export default function LoginPage({
  searchParams,
}: {
  searchParams?: {
    error?: string;
    registered?: string;
    callbackUrl?: string;
  };
}) {
  const error = searchParams?.error
    ? decodeURIComponent(searchParams.error)
    : "";
  const registered = searchParams?.registered === "1";
  const callbackUrl = searchParams?.callbackUrl || "/ats/dashboard";

  return (
    <div className="flex min-height-screen min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#172965] text-xs font-semibold text-white">
            TA
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-slate-900">
              ThinkATS
            </span>
            <span className="text-[11px] text-slate-500">
              Sign in to your ATS workspace
            </span>
          </div>
        </div>

        {registered && (
          <p className="mb-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] text-emerald-800">
            Admin created successfully. You can now sign in.
          </p>
        )}

        {error && (
          <p className="mb-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] text-rose-800">
            {error}
          </p>
        )}

        <form
          method="POST"
          action="/api/auth/login"
          className="space-y-3 text-[13px]"
        >
          <input type="hidden" name="callbackUrl" value={callbackUrl} />

          <div className="space-y-1">
            <label
              htmlFor="email"
              className="text-xs font-medium text-slate-700"
            >
              Work email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
              placeholder="you@company.com"
            />
          </div>

          <div className="space-y-1">
            <label
              htmlFor="password"
              className="text-xs font-medium text-slate-700"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
            />
          </div>

          <button
            type="submit"
            className="mt-2 inline-flex w-full items-center justify-center rounded-full bg-[#172965] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#0f1c48]"
          >
            Sign in
          </button>
        </form>

        <p className="mt-4 text-center text-[11px] text-slate-500">
          First time setting this up?{" "}
          <Link
            href="/register"
            className="font-medium text-[#172965] hover:underline"
          >
            Create admin
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
