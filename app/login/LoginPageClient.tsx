// app/login/LoginPageClient.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  reset?: boolean;
  errorCode?: string | null;
};

export default function LoginPageClient({ reset, errorCode }: Props) {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const effectiveError =
    formError ||
    (errorCode === "invalid_credentials"
      ? "Incorrect email or password."
      : errorCode === "missing_credentials"
      ? "Please enter both email and password."
      : null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const code = data?.error ?? "unknown_error";

        if (code === "invalid_credentials") {
          setFormError("Incorrect email or password.");
        } else if (code === "missing_credentials") {
          setFormError("Please enter both email and password.");
        } else {
          setFormError("Something went wrong while signing in.");
        }
        return;
      }

      // Success → send them into ATS (OTP gate will redirect if needed)
      router.push("/ats");
    } catch (err) {
      console.error("Login request failed", err);
      setFormError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            ThinkATS
          </p>
          <h1 className="text-xl font-semibold text-slate-900">
            Sign in to your workspace
          </h1>
          <p className="text-xs text-slate-600">
            Use your email and password. We&apos;ll ask for OTP on sensitive
            ATS screens.
          </p>
        </div>

        {reset && (
          <div className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] text-emerald-800">
            Your password has been reset. Please sign in with your new
            credentials.
          </div>
        )}

        {effectiveError && (
          <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-700">
            {effectiveError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="space-y-1">
            <label
              htmlFor="email"
              className="text-[11px] font-medium text-slate-700"
            >
              Work email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label
                htmlFor="password"
                className="text-[11px] font-medium text-slate-700"
              >
                Password
              </label>
              <button
                type="button"
                onClick={() => router.push("/forgot-password")}
                className="text-[11px] font-medium text-[#172965] hover:underline"
              >
                Forgot password?
              </button>
            </div>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex w-full items-center justify-center rounded-full bg-[#172965] px-4 py-2 text-[11px] font-semibold text-white shadow-sm hover:bg-[#0f1c48] disabled:opacity-60"
          >
            {submitting ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </main>
  );
}
