// app/ats/verify/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function AtsVerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo") ?? "/ats";

  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(
    "We’ve emailed a one-time code to your admin inbox.",
  );

  // Send initial OTP when the page loads
  useEffect(() => {
    let cancelled = false;

    async function sendInitialCode() {
      setSendingCode(true);
      setError(null);

      try {
        const res = await fetch("/api/auth/otp/request", {
          method: "POST",
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.ok) {
          if (!cancelled) {
            setError("We couldn’t send a code. Please try again.");
          }
        }
      } catch (err) {
        console.error("Initial OTP send failed:", err);
        if (!cancelled) {
          setError("We couldn’t send a code. Please try again.");
        }
      } finally {
        if (!cancelled) {
          setSendingCode(false);
        }
      }
    }

    sendInitialCode();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) {
      setError("Enter the 6-digit code in your email.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setInfo(null);

    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.ok) {
        let message = "That code didn’t work. Please try again.";

        if (data.error === "invalid_or_expired") {
          message = "That code is invalid or has expired. Try again.";
        }

        setError(message);
        setSubmitting(false);
        return;
      }

      router.push(returnTo);
    } catch (err) {
      console.error("OTP verify error:", err);
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  async function handleResend() {
    setSendingCode(true);
    setError(null);
    setInfo(null);

    try {
      const res = await fetch("/api/auth/otp/request", {
        method: "POST",
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.ok) {
        setError("Couldn’t resend code. Please try again.");
      } else {
        setInfo("We’ve sent a fresh code to your email.");
      }
    } catch (err) {
      console.error("OTP resend error:", err);
      setError("Couldn’t resend code. Please try again.");
    } finally {
      setSendingCode(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
            Security check
          </p>
          <h1 className="mt-1 text-lg font-semibold text-slate-900">
            Enter your one-time code
          </h1>
          <p className="mt-1 text-[11px] text-slate-500">
            We use a short-lived OTP to secure access to ATS workspaces.
          </p>
        </div>

        {error && (
          <div className="mb-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] text-rose-700">
            {error}
          </div>
        )}

        {info && !error && (
          <div className="mb-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] text-emerald-800">
            {info}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div className="space-y-1">
            <label
              htmlFor="code"
              className="block text-[11px] font-medium text-slate-700"
            >
              6-digit code
            </label>
            <input
              id="code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) =>
                setCode(e.target.value.replace(/[^0-9]/g, ""))
              }
              className="tracking-[0.3em] text-center block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-base text-slate-900 outline-none ring-0 placeholder:text-slate-300 focus:border-slate-900 focus:bg-white focus:ring-1 focus:ring-slate-900"
              placeholder="••••••"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 inline-flex w-full items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-60"
          >
            {submitting ? "Verifying..." : "Verify and continue"}
          </button>
        </form>

        <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
          <span>Didn&apos;t get a code?</span>
          <button
            type="button"
            disabled={sendingCode}
            onClick={handleResend}
            className="font-semibold text-slate-900 hover:underline disabled:opacity-60"
          >
            {sendingCode ? "Sending..." : "Resend code"}
          </button>
        </div>
      </div>
    </main>
  );
}
