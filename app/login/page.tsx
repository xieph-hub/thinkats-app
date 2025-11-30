// app/login/page.tsx
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Login | ThinkATS",
  description:
    "Sign in to your ThinkATS account to manage jobs, candidates and pipelines.",
};

export default function LoginPage() {
  return (
    <main className="flex min-h-[70vh] items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">
          Welcome back
        </h1>
        <p className="mt-1 text-xs text-slate-600">
          Sign in to access your jobs, candidates and tenant dashboards.
        </p>

        <form className="mt-5 space-y-4" action="#" method="post">
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
              autoComplete="email"
              required
              className="block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
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
              autoComplete="current-password"
              required
              className="block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
              placeholder="••••••••"
            />
          </div>

          <div className="flex items-center justify-between text-xs">
            <label className="inline-flex items-center gap-2 text-slate-600">
              <input
                type="checkbox"
                className="h-3.5 w-3.5 rounded border-slate-300 text-[#172965] focus:ring-[#172965]"
              />
              <span>Keep me signed in</span>
            </label>
            <button
              type="button"
              className="text-xs font-medium text-[#172965] hover:underline"
            >
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            className="mt-2 inline-flex w-full items-center justify-center rounded-full bg-[#172965] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#0f1c48]"
          >
            Sign in
          </button>
        </form>

        <p className="mt-4 text-center text-[11px] text-slate-600">
          Don&apos;t have an account yet?{" "}
          <Link
            href="/signup"
            className="font-semibold text-[#172965] hover:underline"
          >
            Start a free trial
          </Link>
        </p>
      </div>
    </main>
  );
}
