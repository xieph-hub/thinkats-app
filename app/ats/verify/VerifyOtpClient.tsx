// app/ats/verify/VerifyOtpClient.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  callbackUrl: string;
};

type Status = "idle" | "sending" | "sent" | "verifying";

export default function VerifyOtpClient({ callbackUrl }: Props) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  async function requestOtp() {
    setError(null);
    setStatus("sending");
    try {
      const res = await fetch("/api/auth/otp/request", {
        method: "POST",
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || data?.ok === false) {
        const message =
          data?.error ||
          (res.status === 401
            ? "You must be signed in to request a code."
            : "Unable to send code. Please try again.");
        setError(message);
        setStatus("idle");

        if (res.status === 401) {
          router.push("/login?callbackUrl=/ats");
        }

        return;
      }

      setStatus("sent");
    } catch (err) {
      console.error("OTP request error:", err);
      setError("Unable to send code. Please try again.");
      setStatus("idle");
    }
  }

  useEffect(() => {
    // Automatically request OTP on first load
    requestOtp();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const trimmedCode = code.trim();

    if (trimmedCode.length !== 6) {
      setError("Please enter the 6-digit code.");
      return;
    }

    setStatus("verifying");

    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code: trimmedCode }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || data?.ok === false) {
        setError(
          data?.error || "Invalid or expired code. Please request a new one.",
        );
        setStatus("sent");
        return;
      }

      // Success → cookie set → back into /ats flow
      router.push(callbackUrl || "/ats");
    } catch (err) {
      console.error("OTP verify error:", err);
      setError("Something went wrong. Please try again.");
      setStatus("sent");
    }
  }

  const isSending = status === "sending";
  const isVerifying = status === "verifying";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg border border-red-500/40 bg-red-950/40 px-3 py-2 text-xs text-red-200">
          {error}
        </div>
      )}

      <div className="space-y-1.5">
        <label className="block text-xs font-medium text-slate-200">
          6-digit code
        </label>
        <input
          type="text"
          inputMode="numeric"
          maxLength={6}
          value={code}
          onChange={(e) =>
            setCode(e.target.value.replace(/\D/g, ""))
          }
          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-center text-lg tracking-[0.35em] text-slate-50 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          placeholder="••••••"
        />
        <p className="text-xs text-slate-500">
          Enter the one-time code sent to your email.
        </p>
      </div>

      <button
        type="submit"
        disabled={isSending || isVerifying}
        className="inline-flex w-full items-center justify-center rounded-lg bg-indigo-500 px-3 py-2 text-sm font-medium text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isVerifying ? "Verifying…" : "Verify and continue"}
      </button>

      <button
        type="button"
        onClick={requestOtp}
        disabled={isSending || isVerifying}
        className="w-full text-center text-xs font-medium text-indigo-300 hover:text-indigo-200"
      >
        {isSending ? "Sending code…" : "Resend code"}
      </button>
    </form>
  );
}
