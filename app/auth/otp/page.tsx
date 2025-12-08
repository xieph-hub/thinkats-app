// app/auth/otp/page.tsx
"use client";

import { Suspense, useState, useEffect, FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function OtpPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo") || "/ats";

  const [code, setCode] = useState("");
  const [loadingSend, setLoadingSend] = useState(false);
  const [loadingVerify, setLoadingVerify] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function requestCode() {
    setError(null);
    setInfo(null);
    setLoadingSend(true);
    try {
      // ✅ match your API route: /api/otp/request
      const res = await fetch("/api/otp/request", {
        method: "POST",
      });

      let data: any = {};
      try {
        data = await res.json();
      } catch {
        // ignore
      }

      if (!res.ok || data?.ok === false) {
        const apiError = data?.error || `status_${res.status}`;
        setError(`Could not send code (${apiError}).`);
      } else {
        setInfo("We sent a 6-digit code to your email.");
      }
    } catch {
      setError("Network error while requesting code.");
    } finally {
      setLoadingSend(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoadingVerify(true);

    try {
      // ✅ match your API route: /api/otp/verify
      const res = await fetch("/api/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      let data: any = {};
      try {
        data = await res.json();
      } catch {
        // ignore
      }

      if (!res.ok || data?.ok === false) {
        const apiError = data?.error || `status_${res.status}`;

        if (apiError === "invalid_or_expired") {
          setError("That code is invalid or has expired. Try again.");
        } else if (apiError === "missing_code") {
          setError("Please enter your 6-digit code.");
        } else if (apiError === "unauthenticated") {
          setError("Your session expired. Please log in again.");
          router.push(`/login?callbackUrl=${encodeURIComponent(returnTo)}`);
          return;
        } else {
          setError(`Could not verify code (${apiError}).`);
        }
      } else {
        setInfo("Code verified. Redirecting…");
        router.push(returnTo);
        router.refresh();
      }
    } catch {
      setError("Network error while verifying code.");
    } finally {
      setLoadingVerify(false);
    }
  }

  useEffect(() => {
    // Auto-request a code the first time this page loads
    requestCode();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const disabled = loadingSend || loadingVerify;

  return (
    <div className="flex min-h-[80vh] items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h1 className="text-xl font-semibold text-slate-900">
          Enter your one-time code
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          For extra security, we use a one-time code to unlock the ATS
          workspace. Check your inbox for a 6-digit code.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="space-y-1">
            <label
              htmlFor="otp-code"
              className="text-sm font-medium text-slate-700"
            >
              6-digit code
            </label>
            <input
              id="otp-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              maxLength={6}
              className="block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm tracking-[0.3em] text-slate-900 outline-none placeholder:text-slate-400 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
              placeholder="••••••"
            />
          </div>

          {error && (
            <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
              {error}
            </p>
          )}

          {info && !error && (
            <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
              {info}
            </p>
          )}

          <button
            type="submit"
            disabled={disabled}
            className="flex w-full items-center justify-center rounded-full bg-[#172965] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#0f1c48] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loadingVerify ? "Verifying…" : "Verify and continue"}
          </button>
        </form>

        <div className="mt-4 flex items-center justify-between text-xs text-slate-600">
          <span>Didn&apos;t get a code?</span>
          <button
            type="button"
            onClick={requestCode}
            disabled={loadingSend}
            className="font-semibold text-[#172965] hover:underline disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loadingSend ? "Sending…" : "Resend code"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function OtpPage() {
  return (
    <Suspense fallback={null}>
      <OtpPageInner />
    </Suspense>
  );
}
