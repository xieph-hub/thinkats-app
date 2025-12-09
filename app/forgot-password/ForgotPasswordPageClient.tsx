// app/forgot-password/ForgotPasswordPageClient.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ForgotPasswordPageClient() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/auth/password/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        setError("Something went wrong while requesting a reset.");
        return;
      }

      setDone(true);
    } catch (err) {
      console.error("Forgot password error", err);
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">
          Forgot your password?
        </h1>
        <p className="mt-1 text-xs text-slate-600">
          Enter your email and we&apos;ll send a reset code if an account
          exists.
        </p>

        {done ? (
          <div className="mt-4 space-y-3 text-[11px] text-slate-600">
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-emerald-800">
              If an account exists for that email, you&apos;ll receive a reset
              code shortly.
            </div>
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="text-[11px] font-medium text-[#172965] hover:underline"
            >
              Back to login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-700">
                {error}
              </div>
            )}

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

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex w-full items-center justify-center rounded-full bg-[#172965] px-4 py-2 text-[11px] font-semibold text-white shadow-sm hover:bg-[#0f1c48] disabled:opacity-60"
            >
              {submitting ? "Sending..." : "Send reset email"}
            </button>

            <button
              type="button"
              onClick={() => router.push("/login")}
              className="w-full text-[11px] text-slate-500 hover:text-slate-700"
            >
              Back to login
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
