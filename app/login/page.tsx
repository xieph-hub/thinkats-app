// app/login/page.tsx
"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

type Status = "idle" | "loading" | "error";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);

  // If someone hits /login?callbackUrl=/ats/jobs we respect it
  const callbackUrl = searchParams.get("callbackUrl") || "/ats";

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setMessage(null);

    const trimmedEmail = email.trim();

    if (!trimmedEmail || !password) {
      setStatus("error");
      setMessage("Enter your work email and password.");
      return;
    }

    try {
      const { error } = await supabaseBrowser.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });

      if (error) {
        console.error("[ThinkATS] login error:", error);
        setStatus("error");
        setMessage("Invalid email or password.");
        return;
      }

      // ✅ Supabase session is set in cookies; now step into OTP verify
      router.push(
        `/ats/verify?callbackUrl=${encodeURIComponent(callbackUrl)}`
      );
    } catch (err) {
      console.error("[ThinkATS] unexpected login error:", err);
      setStatus("error");
      setMessage("Something went wrong logging you in. Try again.");
    } finally {
      setStatus((prev) => (prev === "loading" ? "idle" : prev));
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-4 py-10 sm:py-14 lg:px-10">
        <header className="pb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            Sign in
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-50 sm:text-4xl">
            Log in to ThinkATS.
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-300">
            Use your work email and password. We&apos;ll add a one-time code on
            the next step to protect access to your ATS workspace.
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
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  placeholder="you@company.com"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-[11px] font-medium uppercase tracking-wide text-slate-400"
                >
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={status === "loading"}
                className="mt-2 inline-flex w-full items-center justify-center rounded-md bg-sky-500 px-3 py-2 text-sm font-semibold text-slate-950 shadow-sm hover:bg-sky-400 disabled:opacity-60"
              >
                {status === "loading" ? "Signing you in…" : "Sign in"}
              </button>

              {status === "error" && message && (
                <p className="mt-3 text-[11px] text-red-400">{message}</p>
              )}
            </form>

            <p className="mt-5 text-[11px] text-slate-500">
              Forgot your password?{" "}
              <Link
                href="/auth/forgot"
                className="font-medium text-slate-100 underline underline-offset-4"
              >
                Reset it
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
