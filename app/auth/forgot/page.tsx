// app/auth/forgot/page.tsx
"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

type Status = "idle" | "loading" | "error" | "success";

export default function ForgotPasswordPage() {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [email, setEmail] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setMessage(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setStatus("error");
      setMessage("Please enter your work email.");
      return;
    }

    try {
      const redirectTo = `${window.location.origin}/auth/reset`;

      const { error } = await supabaseBrowser.auth.resetPasswordForEmail(
        trimmedEmail,
        {
          redirectTo,
        }
      );

      if (error) {
        setStatus("error");
        setMessage(
          error.message ||
            "We couldn’t send a reset link right now. Please try again."
        );
        return;
      }

      setStatus("success");
      setMessage(
        "If an account exists with that email, we’ve sent a password reset link."
      );
    } catch {
      setStatus("error");
      setMessage("Something went wrong. Please try again.");
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-4 py-10 sm:py-14 lg:px-10">
        <header className="pb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            Account access
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-50 sm:text-4xl">
            Forgot your password?
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-300">
            Enter the work email you use for ThinkATS. We’ll send you a secure
            link to set a new password.
          </p>
        </header>

        <section className="lg:max-w-md">
          <div className="rounded-2xl border border-slate-700/70 bg-slate-950/80 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.7)] backdrop-blur">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-[11px] font-medium uppercase tracking-wide text-slate-400"
                >
                  Work email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  placeholder="you@company.com"
                />
              </div>

              <button
                type="submit"
                disabled={status === "loading"}
                className="mt-2 inline-flex w-full items-center justify-center rounded-md bg-sky-500 px-3 py-2 text-sm font-semibold text-slate-950 shadow-sm hover:bg-sky-400 disabled:opacity-60"
              >
                {status === "loading"
                  ? "Sending reset link…"
                  : "Send reset link"}
              </button>

              {status === "error" && message && (
                <p className="mt-3 text-[11px] text-red-400">{message}</p>
              )}
              {status === "success" && message && (
                <p className="mt-3 text-[11px] text-emerald-300">{message}</p>
              )}
            </form>

            <p className="mt-5 text-[11px] text-slate-500">
              Remember your password?{" "}
              <Link
                href="/login"
                className="font-medium text-slate-100 underline underline-offset-4"
              >
                Back to login
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
