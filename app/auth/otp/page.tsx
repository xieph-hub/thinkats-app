// app/auth/otp/page.tsx
"use client";

import {
  useState,
  useEffect,
  useRef,
  type FormEvent,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function OtpPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [code, setCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement | null>(null);

  // Autofocus on the code input
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const rawReturnTo = searchParams.get("returnTo");

  async function handleVerify(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const trimmed = code.trim();
    if (trimmed.length < 6) {
      setError("Please enter the 6-digit code.");
      return;
    }

    setIsVerifying(true);
    try {
      const payload: any = { code: trimmed };
      if (rawReturnTo) {
        payload.returnTo = rawReturnTo;
      }

      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      let data: any = {};
      try {
        data = await res.json();
      } catch {
        // ignore JSON parse errors, fall back to generic message
      }

      if (!res.ok || !data?.ok) {
        const message =
          data?.error ||
          (res.status === 401
            ? "You need to sign in again before verifying a code."
            : `Verification failed (status ${res.status}).`);

        setError(message);
        return;
      }

      const redirectTo: string =
        data?.redirectTo || rawReturnTo || "/ats";

      setSuccess("Code verified. Redirecting…");
      // Small delay is optional; we can go straight to redirect.
      router.push(redirectTo);
    } catch (err) {
      console.error("Error verifying OTP:", err);
      setError("Network error while verifying code. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  }

  async function handleResend() {
    setError(null);
    setSuccess(null);
    setIsResending(true);

    try {
      const res = await fetch("/api/auth/otp/request", {
        method: "POST",
      });

      let data: any = {};
      try {
        data = await res.json();
      } catch {
        // ignore JSON parse errors
      }

      if (!res.ok || !data?.ok) {
        const message =
          data?.error ||
          (res.status === 401
            ? "You need to sign in before requesting a new code."
            : `Unable to resend code (status ${res.status}).`);

        setError(message);
        return;
      }

      setSuccess("A new sign-in code has been sent to your email.");
    } catch (err) {
      console.error("Error resending OTP:", err);
      setError("Network error while resending code. Please try again.");
    } finally {
      setIsResending(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg ring-1 ring-slate-200">
        {/* Brand header */}
        <div className="mb-5 flex flex-col items-center gap-1">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#172965]/5 px-3 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-[#64C247]" />
            <span className="text-[11px] font-medium uppercase tracking-wide text-[#172965]">
              ThinkATS secure sign-in
            </span>
          </div>
          <h1 className="mt-2 text-center text-xl font-semibold text-slate-900">
            Enter your sign-in code
          </h1>
          <p className="mt-1 text-center text-xs text-slate-600">
            We&apos;ve sent a 6-digit code to your email. Enter it below to
            unlock ATS workspaces like jobs, clients and dashboards.
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
            {success}
          </div>
        )}

        {/* Code form */}
        <form onSubmit={handleVerify} className="space-y-4">
          <div className="space-y-1">
            <label
              htmlFor="otp-code"
              className="text-xs font-medium text-slate-700"
            >
              6-digit code
            </label>
            <input
              ref={inputRef}
              id="otp-code"
              name="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, "").slice(0, 6);
                setCode(v);
              }}
              className="block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-center text-lg tracking-[0.3em] text-slate-900 outline-none ring-0 placeholder:text-slate-300 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
              placeholder="••••••"
            />
            <p className="mt-1 text-[10px] text-slate-500">
              Codes expire after a short time. If yours has expired, you can
              request a new one.
            </p>
          </div>

          <button
            type="submit"
            disabled={code.length !== 6 || isVerifying}
            className="flex w-full items-center justify-center rounded-full bg-[#172965] px-4 py-2 text-xs font-semibold text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-60 hover:bg-[#0f1c48]"
          >
            {isVerifying ? "Verifying…" : "Verify code"}
          </button>
        </form>

        {/* Footer actions */}
        <div className="mt-4 flex flex-col items-center gap-2 text-[11px] text-slate-600">
          <button
            type="button"
            onClick={handleResend}
            disabled={isResending}
            className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-medium text-[#172965] hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isResending ? "Resending code…" : "Didn&apos;t get a code? Resend"}
          </button>
          <p className="text-[10px] text-slate-500">
            Check your spam or promotions folder if the email doesn&apos;t show
            up in your inbox.
          </p>
        </div>
      </div>
    </div>
  );
}
