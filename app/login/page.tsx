// app/login/page.tsx
import type { Metadata } from "next";
import Container from "@/components/Container";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Login | ThinkATS",
  description:
    "Sign in to your ThinkATS workspace to manage jobs, candidates and hiring pipelines.",
};

export default function LoginPage() {
  return (
    <main className="bg-slate-50 py-12 md:py-16">
      <Container>
        <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-xl font-semibold text-slate-900">
            Sign in to ThinkATS
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Access your ATS workspace to manage jobs, candidates and reports.
          </p>

          <form className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-medium text-slate-700"
              >
                Work email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-[#1E40AF] focus:outline-none focus:ring-1 focus:ring-[#1E40AF]"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-medium text-slate-700"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-[#1E40AF] focus:outline-none focus:ring-1 focus:ring-[#1E40AF]"
              />
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="inline-flex items-center gap-2 text-slate-600">
                <input
                  type="checkbox"
                  className="h-3.5 w-3.5 rounded border-slate-300 text-[#1E40AF] focus:ring-[#1E40AF]"
                />
                <span>Remember this device</span>
              </label>
              <Link
                href="/forgot-password"
                className="font-semibold text-[#1E40AF] hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              className="mt-2 w-full rounded-lg bg-[#1E40AF] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#1D4ED8]"
            >
              Continue
            </button>
          </form>

          <p className="mt-4 text-xs text-slate-600">
            Don&apos;t have a workspace yet?{" "}
            <Link
              href="/signup"
              className="font-semibold text-[#1E40AF] hover:underline"
            >
              Start a free trial
            </Link>
            .
          </p>
        </div>
      </Container>
    </main>
  );
}
