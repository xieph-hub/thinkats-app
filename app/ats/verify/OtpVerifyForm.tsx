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
  const [resendSuccess, setResendSuccess] = useState(false);

  // Optionally, trigger an OTP send on first mount
  useEffect(() => {
    // If you prefer "click to send", just remove this effect
    let cancelled = false;

    async function autoRequestOtp() {
      try {
        const res = await fetch("/api/auth/otp/request", {
          method: "POST",
        });

        if (!res.ok) return;
        if (cancelled) return;

        setInfo("We’ve sent a fresh code to your email.");
      } catch {
        // Fail silently here – user can still use the manual resend button
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
    if (!trimmed || trimmed.length < 4) {
      setError("Please enter the 6-digit code from your email.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code: trimmed, returnTo }),
      });

      let data: any = null;
      try {
        data = await res.json();
      } catch {
        // ignore parse errors
      }

      if (!res.ok || !data?.ok) {
        const message =
          data?.error === "invalid_code"
            ? "That code didn’t look right. Please check and try again."
            : data?.error === "expired_code"
              ? "This code has expired. Please request a new one."
              : data?.error || "We couldn’t verify that code. Try again.";
        setError(message);
        return;
      }

      // OTP verified successfully.
      // Backend should mark this device/session as OTP-verified so
      // ensureOtpVerified stops redirecting.
      const target = (data.returnTo as string) || returnTo || "/ats";
      router.push(target);
    } catch (err: any) {
      console.error("OTP verify error", err);
      setError("Unexpected error verifying your code. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResend() {
    setError(null);
    setInfo(null);
    setResendSuccess(false);
    setIsResending(true);

    try {
      const res = await fetch("/api/auth/otp/request", {
        method: "POST",
      });

      let data: any = null;
      try {
        data = await res.json();
      } catch {
        // ignore
      }

      if (!res.ok || data?.ok === false) {
        setError(
          data?.error ||
            "We couldn’t send a new code right now. Please wait a moment and try again.",
        );
        return;
      }

      setResendSuccess(true);
      setInfo("We’ve just sent you a new code.");
    } catch (err: any) {
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
        <label
          htmlFor="otp"
          className="text-[11px] font-medium text-slate-700"
        >
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
          className="block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-center text-sm tracking-[0.6em] text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
        />
        <p className="mt-1 text-[10px] text-slate-500">
          This code is valid for a short period and only needs to be entered
          once per device and browser.
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
          {email
            ? `Didn’t get it? Check spam for ${email}.`
            : "Didn’t get the code? Check your spam folder."}
        </span>
        <button
          type="button"
          onClick={handleResend}
          disabled={isResending}
          className="text-[#172965] underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isResending ? "Resending…" : "Resend code"}
        </button>
      </div>

      {resendSuccess && (
        <p className="text-right text-[10px] text-emerald-700">
          New code sent. It may take a few seconds to arrive.
        </p>
      )}
    </form>
  );
}
