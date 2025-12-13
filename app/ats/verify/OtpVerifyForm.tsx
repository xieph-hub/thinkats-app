// app/ats/verify/OtpVerifyForm.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type Props = {
  email?: string;
  returnTo: string;
};

export default function OtpVerifyForm({ email, returnTo }: Props) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function autoRequestOtp() {
      try {
        const res = await fetch("/api/auth/otp/request", { method: "POST" });
        if (!res.ok) return;
        if (!cancelled) setInfo("We’ve sent a fresh code to your email.");
      } catch {
        // silent
      }
    }

    void autoRequestOtp();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setInfo(null);

    const trimmed = code.trim();
    if (trimmed.length !== 6) {
      setError("Please enter the 6-digit code from your email.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: trimmed, returnTo }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.status === 401) {
        router.push(`/login?returnTo=${encodeURIComponent(returnTo || "/ats")}`);
        return;
      }

      if (!res.ok || !data?.ok) {
        const msg =
          data?.error === "invalid_or_expired_code"
            ? "That code is invalid or has expired. Please request a new one."
            : data?.error === "missing_code"
              ? "Please enter the code."
              : "We couldn’t verify that code. Try again.";
        setError(msg);
        return;
      }

      router.push(data.returnTo || returnTo || "/ats");
    } catch (err) {
      console.error("OTP verify error", err);
      setError("Unexpected error verifying your code. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResend() {
    setError(null);
    setInfo(null);
    setIsResending(true);

    try {
      const res = await fetch("/api/auth/otp/request", { method: "POST" });

      if (res.status === 401) {
        router.push(`/login?returnTo=${encodeURIComponent(returnTo || "/ats")}`);
        return;
      }

      if (!res.ok) {
        setError("We couldn’t send a new code right now. Please try again.");
        return;
      }

      setInfo("We’ve just sent you a new code.");
    } catch (err) {
      console.error("OTP resend error", err);
      setError("Unable to resend code. Please try again shortly.");
    } finally {
      setIsResending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-700">
          {error}
        </div>
      )}

      {info && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] text-emerald-800">
          {info}
        </div>
      )}

      <div className="space-y-1">
        <label htmlFor="otp" className="text-[11px] font-medium text-slate-700">
          One-time passcode
        </label>
        <input
          id="otp"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={code}
          onChange={(e) =>
            setCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))
          }
          placeholder="Enter 6-digit code"
          className="block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-center text-sm tracking-[0.6em] text-slate-900 outline-none placeholder:text-slate-400 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
        />
        <p className="mt-1 text-[10px] text-slate-500">
          This only needs to be entered once per device/browser (for about 60 minutes).
        </p>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="flex w-full items-center justify-center rounded-full bg-[#172965] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#12204f] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting ? "Verifying…" : "Verify code"}
      </button>

      <div className="flex items-center justify-between text-[11px] text-slate-500">
        <span>
          {email ? `Check spam for ${email}.` : "Didn’t get the code? Check spam."}
        </span>
        <button
          type="button"
          onClick={handleResend}
          disabled={isResending}
          className="text-[#172965] underline-offset-2 hover:underline disabled:opacity-60"
        >
          {isResending ? "Resending…" : "Resend code"}
        </button>
      </div>
    </form>
  );
}
