// app/login/LoginForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  callbackUrl: string;
};

export default function LoginForm({ callbackUrl }: Props) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch(
        `/api/auth/login?callbackUrl=${encodeURIComponent(callbackUrl)}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: trimmedEmail,
            password,
          }),
        },
      );

      const data = await res.json();

      if (!res.ok || !data.ok) {
        setError(data.error || "Unable to sign you in.");
        setIsSubmitting(false);
        return;
      }

      router.push(data.redirectTo || "/ats");
    } catch (err) {
      console.error("Login submit error:", err);
      setError("Something went wrong. Please try again.");
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg border border-red-500/40 bg-red-950/40 px-3 py-2 text-xs text-red-200">
          {error}
        </div>
      )}

      <div className="space-y-1.5">
        <label className="block text-xs font-medium text-slate-200">
          Work email
        </label>
        <input
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          placeholder="you@company.com"
          required
        />
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs font-medium text-slate-200">
          Password
        </label>
        <input
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          placeholder="••••••••"
          required
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-2 inline-flex w-full items-center justify-center rounded-lg bg-indigo-500 px-3 py-2 text-sm font-medium text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Signing you in…" : "Sign in"}
      </button>

      <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
        <span>Admins only</span>
        <a
          href="/auth/forgot"
          className="font-medium text-indigo-400 hover:text-indigo-300"
        >
          Forgot password?
        </a>
      </div>
    </form>
  );
}
