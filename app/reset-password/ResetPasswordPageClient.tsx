// app/reset-password/ResetPasswordPageClient.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ResetPasswordPageClient({
  initialEmail,
  initialCode,
}: {
  initialEmail?: string;
  initialCode?: string;
}) {
  const router = useRouter();

  const [email, setEmail] = useState(initialEmail ?? "");
  const [code, setCode] = useState(initialCode ?? "");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email || !code || !password) {
      setError("Please fill in all fields.");
      return;
    }

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/auth/password/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, password }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        const code = data?.error ?? "unknown_error";
        if (code === "invalid_or_expired_code") {
          setError("The reset code is invalid or has expired.");
        } else {
          setError("Something went wrong while resetting your password.");
        }
        return;
      }

      // Success → go to login with reset flag
      router.push("/login?reset=1");
    } catch (err) {
      console.error("Reset password error", err);
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">
          Reset your password
        </h1>
        <p className="mt-1 text-xs text-slate-600">
          Enter the email, reset code you received, and your new password.
        </p>

        {error && (
          <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
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
              className="block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
            />
          </div>

          <div className="space-y-1">
            <label
              htmlFor="code"
              className="text-[11px] font-medium text-slate-700"
            >
              Reset code
            </label>
            <input
              id="code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
            />
          </div>

          <div className="space-y-1">
            <label
              htmlFor="password"
              className="text-[11px] font-medium text-slate-700"
            >
              New password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
            />
          </div>

          <div className="space-y-1">
            <label
              htmlFor="confirm"
              className="text-[11px] font-medium text-slate-700"
            >
              Confirm new password
            </label>
            <input
              id="confirm"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex w-full items-center justify-center rounded-full bg-[#172965] px-4 py-2 text-[11px] font-semibold text-white shadow-sm hover:bg-[#0f1c48] disabled:opacity-60"
          >
            {submitting ? "Resetting..." : "Reset password"}
          </button>
        </form>
      </div>
    </main>
  );
}
