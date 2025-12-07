// app/login/LoginPageClient.tsx
"use client";

import { useState, FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import type { LoginBrandConfig } from "./page";

type Props = {
  brand: LoginBrandConfig;
};

export default function LoginPageClient({ brand }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Where to go after login – defaults to /ats
  const callbackUrl = searchParams.get("callbackUrl") || "/ats";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const data = await res.json().catch(() => ({} as any));

      if (!res.ok || data?.error) {
        setError(
          data?.error ||
            "Unable to login. Please check your details and try again.",
        );
        setSubmitting(false);
        return;
      }

      // Successful login: send user to the ATS (or the callback target) and refresh
      router.push(callbackUrl);
      router.refresh();
    } catch (err) {
      console.error("Login error", err);
      setError("Something went wrong while logging you in. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center bg-slate-50 px-4 py-12">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 lg:flex-row lg:items-center">
        {/* Left: brand copy (tenant-aware) */}
        <section className="flex-1 space-y-4">
          <p className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-slate-600">
            <span>{brand.badgeLabel}</span>
            {!brand.isPrimaryHost && (
              <span className="text-[10px] font-normal lowercase text-slate-500">
                • Powered by ThinkATS
              </span>
            )}
          </p>

          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            {brand.headline}
          </h1>

          <p className="max-w-xl text-sm text-slate-600 sm:text-base">
            {brand.subcopy}
          </p>

          {/* Keep this subtle – not heavy marketing, just reassurance */}
          <ul className="mt-4 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
            <li className="flex items-start gap-2">
              <span className="mt-1 text-xs">●</span>
              <span>Track roles from brief to offer in one place.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 text-xs">●</span>
              <span>See candidate history, notes and stages clearly.</span>
            </li>
            {brand.isPrimaryHost && (
              <>
                <li className="flex items-start gap-2">
                  <span className="mt-1 text-xs">●</span>
                  <span>Serve multiple clients from one ATS workspace.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 text-xs">●</span>
                  <span>Power career sites and share live pipelines.</span>
                </li>
              </>
            )}
          </ul>
        </section>

        {/* Right: login card (colour-aware) */}
        <section className="flex-1">
          <div className="mx-auto w-full max-w-md rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">
              Sign in to your workspace
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Use your work email and password to access{" "}
              {brand.isPrimaryHost
                ? "your ThinkATS workspace."
                : `${brand.brandName}’s ATS workspace.`}
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="email"
                  className="block text-xs font-medium text-slate-700"
                >
                  Work email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none ring-0 transition hover:border-slate-300 focus:border-slate-900 focus:bg-white focus:ring-2 focus:ring-slate-900/10"
                  placeholder="you@company.com"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="block text-xs font-medium text-slate-700"
                  >
                    Password
                  </label>
                  <Link
                    href="/auth/reset"
                    className="text-xs font-medium text-slate-700 hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none ring-0 transition hover:border-slate-300 focus:border-slate-900 focus:bg-white focus:ring-2 focus:ring-slate-900/10"
                  placeholder="Enter your password"
                />
              </div>

              {error && (
                <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                style={{ backgroundColor: brand.primaryColorHex }}
                className="flex w-full items-center justify-center rounded-full px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitting ? "Logging in…" : "Login"}
              </button>
            </form>

            {/* Footers differ for platform vs tenant */}
            {brand.isPrimaryHost ? (
              <p className="mt-4 text-center text-xs text-slate-500">
                Don&apos;t have an account?{" "}
                <Link
                  href="/signup"
                  className="font-medium text-slate-800 hover:underline"
                >
                  Start a free trial
                </Link>
              </p>
            ) : (
              <p className="mt-4 text-center text-[11px] text-slate-400">
                Powered by{" "}
                <span className="font-semibold text-slate-600">
                  ThinkATS
                </span>
                .
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
