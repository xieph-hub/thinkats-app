// app/ats/verify/VerifyOtpPageClient.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function VerifyOtpPageClient() {
  const router = useRouter();

  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sending, setSending] = useState(false);
  const [hasRequestedOnce, setHasRequestedOnce] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  // Auto-request an OTP once when user lands here
  useEffect(() => {
    if (hasRequestedOnce) return;
    void handleSendCode(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasRequestedOnce]);

  async function handleSendCode(isInitial = false) {
    setError(null);
    if (!isInitial) {
      setInfo(null);
    }
    setSending(true);

    try {
      const res = await fetch("/api/auth/otp/request", {
        method: "POST",
      });

      if (res.status === 401) {
        router.push("/login");
        return;
      }

      if (!res.ok) {
        setError("Could not send code. Please try again.");
        return;
      }

      setHasRequestedOnce(true);
      setInfo(
        isInitial
          ? "We’ve sent a code to your email."
          : "A new code has been sent to your email.",
      );
    } catch (err) {
      console.error("OTP request error", err);
      setError("Network error while sending code. Please try again.");
    } finally {
      setSending(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.status === 401) {
        // Session is gone – send them back to login
        router.push("/login");
        return;
      }

      if (!res.ok || !data.ok) {
        const code = data?.error ?? "unknown_error";
        if (code === "invalid_or_expired_code") {
          setError("That code is invalid or has expired.");
        } else if (code === "missing_code") {
          setError("Please enter your code.");
        } else {
          setError("Something went wrong verifying your code.");
        }
        return;
      }

      // OTP verified – go into ATS
      router.push("/ats");
    } catch (err) {
      console.error("OTP verify error", err);
      setError("Network error while verifying. Please try again.");
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
            Verify it&apos;s really you
          </h1>
          <p className="text-xs text-slate-600">
            We&apos;ve sent a one-time code to your email. Enter it below to
            continue to your ATS workspace.
          </p>
        </div>

        {info && (
          <div className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] text-emerald-800">
            {info}
          </div>
        )}

        {error && (
          <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="space-y-1">
            <label
              htmlFor="code"
              className="text-[11px] font-medium text-slate-700"
            >
              Verification code
            </label>
            <input
              id="code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="123456"
              className="block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
            />
            <p className="pt-1 text-[10px] text-slate-500">
              Codes expire after 10 minutes.
            </p>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex w-full items-center justify-center rounded-full bg-[#172965] px-4 py-2 text-[11px] font-semibold text-white shadow-sm hover:bg-[#0f1c48] disabled:opacity-60"
          >
            {submitting ? "Verifying..." : "Verify and continue"}
          </button>

          <button
            type="button"
            onClick={() => handleSendCode(false)}
            disabled={sending}
            className="w-full text-[11px] font-medium text-[#172965] hover:underline disabled:opacity-60"
          >
            {sending ? "Sending..." : "Resend code"}
          </button>

          <button
            type="button"
            onClick={() => router.push("/login")}
            className="w-full text-[11px] text-slate-500 hover:text-slate-700"
          >
            Back to login
          </button>
        </form>
      </div>
    </main>
  );
}
