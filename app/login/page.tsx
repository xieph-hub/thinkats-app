import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Login | ThinkATS",
  description: "Sign in to the ThinkATS admin workspace.",
};

export default function LoginPage({
  searchParams,
}: {
  searchParams?: { error?: string };
}) {
  const error = searchParams?.error;

  let errorMessage: string | null = null;
  if (error === "invalid") {
    errorMessage = "Invalid email or password. Please try again.";
  } else if (error === "admin_exists") {
    errorMessage = "An admin already exists. Please sign in below.";
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900/80 p-6 text-sm text-slate-100 shadow-lg">
        <h1 className="text-lg font-semibold text-white">Sign in</h1>
        <p className="mt-1 text-xs text-slate-300">
          Access your ThinkATS admin workspace.
        </p>

        {errorMessage && (
          <p className="mt-3 rounded border border-rose-500/50 bg-rose-500/10 px-2 py-1 text-[11px] text-rose-100">
            {errorMessage}
          </p>
        )}

        <form
          method="POST"
          action="/api/auth/login"
          className="mt-4 space-y-3 text-xs"
        >
          <div className="space-y-1">
            <label
              htmlFor="email"
              className="text-[11px] font-medium text-slate-200"
            >
              Work email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="block w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 outline-none ring-0 placeholder:text-slate-500 focus:border-[#FFC000] focus:ring-1 focus:ring-[#FFC000]"
              placeholder="you@company.com"
            />
          </div>

          <div className="space-y-1">
            <label
              htmlFor="password"
              className="text-[11px] font-medium text-slate-200"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="block w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 outline-none ring-0 placeholder:text-slate-500 focus:border-[#FFC000] focus:ring-1 focus:ring-[#FFC000]"
            />
          </div>

          <button
            type="submit"
            className="mt-2 inline-flex w-full items-center justify-center rounded-full bg-[#FFC000] px-4 py-2 text-xs font-semibold text-slate-900 hover:bg-[#e6ae00]"
          >
            Sign in
          </button>
        </form>

        <p className="mt-4 text-[10px] text-slate-400">
          First time setting this up? If no admin exists yet, use{" "}
          <Link
            href="/register"
            className="font-medium text-[#FFC000] hover:underline"
          >
            Create first admin
          </Link>
          .
        </p>

        <div className="mt-4 flex justify-between text-[10px] text-slate-500">
          <Link href="/" className="hover:text-slate-200 hover:underline">
            ← Back to site
          </Link>
        </div>
      </div>
    </div>
  );
}
