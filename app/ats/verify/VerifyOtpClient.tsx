// app/ats/verify/VerifyOtpClient.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function VerifyOtpClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [code, setCode] = useState("");
  const [status, setStatus] =
    useState<"idle" | "sending" | "sent" | "verifying">("sending");
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

      router.push(callbackUrl);
    } catch {
      setError("Network error while verifying code.");
      setStatus("sent");
    }
  }

  const isBusy = status === "sending" || status === "verifying";

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-4">
      {/* ... your existing JSX ... */}
    </form>
  );
}
