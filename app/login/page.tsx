// app/login/page.tsx
"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Only allow internal callback URLs for safety
  const rawCallback = searchParams.get("callbackUrl");
  const callbackUrl =
    rawCallback && rawCallback.startsWith("/") ? rawCallback : "/ats";

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    const { error } = await supabaseBrowser.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMsg(error.message || "Unable to log in. Please try again.");
      setIsSubmitting(false);
      return;
    }

    // Hard navigation so the new auth cookies are visible to server/middleware
    router.replace(callbackUrl);
  }

  return (
    <div className="flex min-h-[calc(100vh-64px-64px)] items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl">
          Log in to ThinkATS
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Access your ATS workspace to manage roles, pipelines and candidates.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-slate-700"
            >
              Work email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:border-[#1E40AF] focus:ring-2 focus:ring-[#1E40AF]/20"
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-700"
              >
                Password
              </label>
              <Link
                href="/auth/forgot"
                className="text-xs font-medium text-[#1E40AF] hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:border-[#1E40AF] focus:ring-2 focus:ring-[#1E40AF]/20"
            />
          </div>

          {errorMsg && (
            <p className="text-sm text-red-600" role="alert">
              {errorMsg}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center rounded-lg bg-[#1E40AF] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1D3A9A] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Logging you in..." : "Log in"}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-slate-600">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="font-semibold text-[#1E40AF] hover:underline"
          >
            Start a free trial
          </Link>
        </p>
      </div>
    </div>
  );
}
