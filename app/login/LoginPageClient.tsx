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
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const data = await res.json().catch(() => ({} as any));

      if (!res.ok || (data && (data as any).error)) {
        setError(
          (data as any)?.error ||
            "Unable to login. Please check your details and try again.",
        );
        setSubmitting(false);
        return;
      }

      router.push(callbackUrl);
      router.refresh();
    } catch (err) {
      console.error("Login error", err);
      setError(
        "Something went wrong while logging you in. Please try again.",
      );
      setSubmitting(false);
    }
  }

  const isPrimary = brand.isPrimaryHost;
  const heading = brand.heading;
  const subheading = brand.subheading;
  const tagline = brand.tagline;

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center bg-slate-50 px-4 py-12">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 lg:flex-row lg:items-center">
        {/* Left: brand copy */}
        <section className="flex-1 space-y-4">
          <p className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">
            {tagline}
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            {heading}
          </h1>
          <p className="max-w-xl text-sm text-slate-600 sm:text-base">
            {subheading}
          </p>

          {isPrimary ? (
            <ul className="mt-4 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
              <li className="flex items-start gap-2">
                <span className="mt-1 text-xs">●</span>
                <span>Track every role from brief to offer.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 text-xs">●</span>
                <span>See candidate history and notes in one place.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 text-xs">●</span>
                <span>Share live pipelines with hiring managers.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 text-xs">●</span>
                <span>Power your career sites with ThinkATS.</span>
              </li>
            </ul>
          ) : (
            <ul className="mt-4 space-y-1.5 text-xs text-slate-600">
              <li className="flex items-start gap-2">
                <span className="mt-[3px] h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span>
                  This login is for admins and hiring managers at{" "}
                  {brand.tenantName || brand.tenantSlug}.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-[3px] h-1.5 w-1.5 rounded-full bg-sky-400" />
                <span>
                  Candidates can browse and apply via the public careers and
                  jobs pages without an account.
                </span>
              </li>
            </ul>
          )}

          {!isPrimary && (
            <p className="mt-4 text-[11px] text-slate-400">
              Powered by{" "}
              <span className="font-medium text-slate-600">ThinkATS</span>.
            </p>
          )}
        </section>

        {/* Right: login card */}
        <section className="flex-1">
          <div className="mx-auto w-full max-w-md rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">
              {isPrimary ? "Login to ThinkATS" : "Admin login"}
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Use your work email and password to access your ATS workspace.
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
                  className="block w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none ring-0 transition hover:border-slate-300 focus:border-[#1E40AF] focus:bg-white focus:ring-2 focus:ring-[#1E40AF]/20"
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
                    className="text-xs font-medium text-[#1E40AF] hover:underline"
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
                  className="block w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none ring-0 transition hover:border-slate-300 focus:border-[#1E40AF] focus:bg-white focus:ring-2 focus:ring-[#1E40AF]/20"
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
                className="flex w-full items-center justify-center rounded-full bg-[#1E40AF] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1D3A9A] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitting ? "Logging in…" : "Login"}
              </button>
            </form>

            {isPrimary && (
              <p className="mt-4 text-center text-xs text-slate-500">
                Don&apos;t have an account?{" "}
                <Link
                  href="/signup"
                  className="font-medium text-[#1E40AF] hover:underline"
                >
                  Start a free trial
                </Link>
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
