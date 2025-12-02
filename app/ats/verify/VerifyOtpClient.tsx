// app/ats/verify/VerifyOtpClient.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function VerifyOtpClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "verifying">("sending");
  const [error, setError] = useState<string | null>(null);

  const callbackUrl = searchParams.get("callbackUrl") || "/ats";

  // Request OTP once when page loads
  useEffect(() => {
    let cancelled = false;

    async function send() {
      setStatus("sending");
      setError(null);
      try {
        const res = await fetch("/api/auth/otp/request", {
          method: "POST",
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          if (!cancelled) {
            setError(data.error || "Could not send code. Try again.");
            setStatus("idle");
          }
          return;
        }
        if (!cancelled) setStatus("sent");
      } catch (e) {
        if (!cancelled) {
          setError("Network error while sending code. Try again.");
          setStatus("idle");
        }
      }
    }

    send();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleResend() {
    setStatus("sending");
    setError(null);
    try {
      const res = await fetch("/api/auth/otp/request", {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Could not resend code.");
        setStatus("idle");
        return;
      }
      setStatus("sent");
    } catch {
      setError("Network error while resending code.");
      setStatus("idle");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!code || code.trim().length !== 6) {
      setError("Enter the 6-digit code from your email.");
      return;
    }

    setStatus("verifying");
    setError(null);

    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || "Invalid code. Try again.");
        setStatus("sent");
        return;
      }

      // Success – redirect into ATS
      router.push(callbackUrl);
    } catch {
      setError("Network error while verifying code.");
      setStatus("sent");
    }
  }

  const isBusy = status === "sending" || status === "verifying";

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-4">
      <div className="space-y-2">
        <label
          htmlFor="otp"
          className="text-xs font-medium text-slate-700"
        >
          One-time code
        </label>
        <input
          id="otp"
          inputMode="numeric"
          maxLength={6}
          autoComplete="one-time-code"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-center text-lg tracking-[0.3em] text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          value={code}
          onChange={(e) =>
            setCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))
          }
        />
        <p className="text-[11px] text-slate-500">
          Codes expire after 10 minutes. For security, don&apos;t forward
          this email to anyone.
        </p>
      </div>

      {error && (
        <p className="text-xs text-red-600">
          {error}
        </p>
      )}

      <div className="flex items-center justify-between gap-3">
        <button
          type="submit"
          disabled={isBusy || code.length !== 6}
          className="inline-flex flex-1 items-center justify-center rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
        >
          {status === "verifying" ? "Verifying…" : "Verify code"}
        </button>

        <button
          type="button"
          onClick={handleResend}
          disabled={status === "sending"}
          className="text-xs font-medium text-indigo-600 hover:text-indigo-700 disabled:cursor-not-allowed disabled:text-indigo-300"
        >
          {status === "sending" ? "Sending…" : "Resend code"}
        </button>
      </div>
    </form>
  );
}
