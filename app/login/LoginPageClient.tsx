// app/login/LoginPageClient.tsx
"use client";

import { useState, FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

type LoginBrandConfig = {
  mode: "tenant" | "multi";
  tenantName?: string | null;
  tenantSlug?: string | null;
  logoUrl?: string | null;
  primaryColor: string;
  accentColor: string;
};

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

  const callbackUrl = searchParams.get("callbackUrl") || "/ats";

  const isTenantMode = brand.mode === "tenant";
  const tenantName = brand.tenantName ?? "";
  const headingName = isTenantMode ? tenantName : "ThinkATS";
  const chipLabel = isTenantMode
    ? `${tenantName} ATS`
    : "ThinkATS";

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

      if (!res.ok || (data as any)?.error) {
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

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center bg-slate-50 px-4 py-12">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 lg:flex-row lg:items-center">
        {/* Left: brand-first copy */}
        <section className="flex-1 space-y-4">
          <div className="flex items-center gap-3">
            {brand.logoUrl && (
              <div className="relative h-9 w-9 overflow-hidden rounded-xl border border-slate-200 bg-white">
                <Image
                  src={brand.logoUrl}
                  alt={`${headingName} logo`}
                  fill
                  sizes="40px"
                  className="object-contain p-1"
                />
              </div>
            )}
            <span
              className="inline-flex items-center rounded-full px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em]"
              style={{
                backgroundColor: `${brand.accentColor}1A`, // light tint
                color: "#0f172a",
              }}
            >
              {chipLabel}
            </span>
          </div>

          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            {isTenantMode
              ? `Sign in to ${headingName} ATS`
              : "Sign in to your ATS workspace"}
          </h1>

          <p className="max-w-xl text-sm text-slate-600 sm:text-base">
            {isTenantMode
              ? `This is the private hiring workspace ${headingName} uses to manage roles, candidates and interview pipelines.`
              : "Access roles, candidates, client workspaces and hiring pipelines from one place."}
          </p>

          {isTenantMode ? (
            <p className="text-xs text-slate-500">
              Use the work email your team set up for this ATS workspace.
              Only authorised team members can sign in.
            </p>
          ) : (
            <p className="text-xs text-slate-500">
              Use your work email and password to access your ThinkATS
              workspaces.
            </p>
          )}
        </section>

        {/* Right: login card */}
        <section className="flex-1">
          <div className="mx-auto w-full max-w-md rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">
              {isTenantMode
                ? `Login to ${headingName} ATS`
                : "Login"}
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              {isTenantMode
                ? "Enter your work email and password to continue."
                : "Use your work email and password to access your workspace."}
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
                className="flex w-full items-center justify-center rounded-full px-4 py-2 text-sm font-semibold text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-70"
                style={{ backgroundColor: brand.primaryColor }}
              >
                {submitting ? "Logging in…" : "Login"}
              </button>
            </form>

            {!isTenantMode && (
              <p className="mt-4 text-center text-xs text-slate-500">
                Don&apos;t have an account?{" "}
                <Link
                  href="/signup"
                  className="font-medium text-slate-800 hover:underline"
                >
                  Start a free trial
                </Link>
              </p>
            )}

            {/* Tiny powered-by footer */}
            <p className="mt-4 text-center text-[11px] text-slate-400">
              Powered by{" "}
              <span className="font-semibold text-slate-600">
                ThinkATS
              </span>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
