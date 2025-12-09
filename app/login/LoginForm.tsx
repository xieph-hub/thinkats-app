// app/login/LoginForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  returnTo: string;
};

export default function LoginForm({ returnTo }: Props) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Extra defensive check, even though the server already sanitised it
  function getSafeReturnTo() {
    if (!returnTo) return "/ats";
    if (!returnTo.startsWith("/")) return "/ats";
    if (returnTo.startsWith("//")) return "/ats";
    return returnTo;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      let data: any = null;
      try {
        data = await res.json();
      } catch {
        // ignore JSON parse errors
      }

      if (!res.ok || !data?.ok) {
        const message =
          data?.error === "invalid_credentials"
            ? "Incorrect email or password."
            : data?.error === "missing_credentials"
              ? "Email and password are required."
              : data?.error || "Unable to sign you in. Please try again.";
        setError(message);
        return;
      }

      // Supabase session cookie is set by /api/auth/login
      // OtpGateClient will take over from here.
      const target = getSafeReturnTo();
      router.push(target);
    } catch (err: any) {
      console.error("Login error", err);
      setError("Unexpected error signing in. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-700">
          {error}
        </div>
      )}

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
          placeholder="you@company.com"
          className="block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
        />
      </div>

      <div className="space-y-1">
        <label
          htmlFor="password"
          className="text-[11px] font-medium text-slate-700"
        >
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className="block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="flex w-full items-center justify-center rounded-full bg-[#172965] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#12204f] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
