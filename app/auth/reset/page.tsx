// app/auth/reset/page.tsx
"use client";

import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

type Status = "idle" | "loading" | "error" | "success";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [hasRecoverySession, setHasRecoverySession] = useState<boolean | null>(
    null
  );

  // Check we actually have a logged-in (recovery) user
  useEffect(() => {
    let cancelled = false;

    async function checkUser() {
      const { data, error } = await supabaseBrowser.auth.getUser();
      if (cancelled) return;

      if (error || !data?.user) {
        setHasRecoverySession(false);
      } else {
        setHasRecoverySession(true);
      }
    }

    checkUser();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (password.length < 8) {
      setStatus("error");
      setMessage("Password should be at least 8 characters long.");
      return;
    }

    if (password !== confirm) {
      setStatus("error");
      setMessage("Passwords do not match.");
      return;
    }

    setStatus("loading");
    setMessage(null);

    const { error } = await supabaseBrowser.auth.updateUser({
      password,
    });

    if (error) {
      setStatus("error");
      setMessage(error.message || "Could not reset password.");
      return;
    }

    setStatus("success");
    setMessage("Password updated. You can now sign in with your new password.");

    // Small delay then push to login
    setTimeout(() => router.push("/login"), 1500);
  }

  // While we're checking if there's a session
  if (hasRecoverySession === null) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
        <div className="flex min-h-screen items-center justify-center px-4">
          <p className="text-xs text-slate-300">Preparing password reset…</p>
        </div>
      </main>
    );
  }

  // If there's no valid recovery session
  if (hasRecoverySession === false) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
        <div className="flex min-h-screen items-center justify-center px-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-700/70 bg-slate-950/80 p-6 text-sm text-slate-200 shadow-[0_20px_60px_rgba(0,0,0,0.7)]">
            <h1 className="text-base font-semibold text-slate-50">
              Reset link not valid
            </h1>
            <p className="mt-2 text-xs text-slate-400">
              This reset link may have expired or already been used. Please
              request a new password reset from the login page.
            </p>
            <div className="mt-4 flex gap-2">
              <Link
                href="/login"
                className="inline-flex flex-1 items-center justify-center rounded-md bg-sky-500 px-3 py-2 text-xs font-semibold text-slate-950 hover:bg-sky-400"
              >
                Back to login
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Normal "set new password" UI
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-4 py-10 sm:py-14 lg:px-10">
        <header className="pb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            Password reset
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-50 sm:text-4xl">
            Set a new password.
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-300">
            Choose a strong password you haven’t used before. You’ll use this to
            sign in to ThinkATS going forward.
          </p>
        </header>

        <section className="lg:max-w-md">
          <div className="rounded-2xl border border-slate-700/70 bg-slate-950/80 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.7)] backdrop-blur">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="password"
                  className="block text-[11px] font-medium uppercase tracking-wide text-slate-400"
                >
                  New password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label
                  htmlFor="confirm"
                  className="block text-[11px] font-medium uppercase tracking-wide text-slate-400"
                >
                  Confirm password
                </label>
                <input
                  id="confirm"
                  name="confirm"
                  type="password"
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={status === "loading"}
                className="mt-2 inline-flex w-full items-center justify-center rounded-md bg-sky-500 px-3 py-2 text-sm font-semibold text-slate-950 shadow-sm hover:bg-sky-400 disabled:opacity-60"
              >
                {status === "loading" ? "Updating password…" : "Update password"}
              </button>

              {status === "error" && message && (
                <p className="mt-3 text-[11px] text-red-400">{message}</p>
              )}
              {status === "success" && message && (
                <p className="mt-3 text-[11px] text-emerald-400">{message}</p>
              )}
            </form>

            <p className="mt-5 text-[11px] text-slate-500">
              If you didn’t request this change,{" "}
              <Link
                href="/contact"
                className="font-medium text-slate-100 underline underline-offset-4"
              >
                contact the ThinkATS team
              </Link>{" "}
              so we can review your account.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
