// app/login/LoginFormClient.tsx
"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginFormClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [workspace, setWorkspace] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const callbackParam = searchParams.get("callbackUrl");
  const callbackPath =
    callbackParam && callbackParam.startsWith("/")
      ? callbackParam
      : "/ats"; // default landing after login

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
          workspace: workspace.trim() || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Unable to log in. Please try again.");
      }

      setSuccessMessage("Logged in successfully. Redirecting…");
      // Navigate into ATS; server sees cookies and lets us in
      router.push(callbackPath);
    } catch (err: any) {
      setErrorMessage(
        err?.message || "Something went wrong while logging you in."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid w-full gap-10 rounded-3xl bg-slate-900 px-6 py-8 text-white shadow-xl sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] sm:px-10 sm:py-10 lg:px-12 lg:py-12">
      {/* Left side – copy */}
      <div className="space-y-4">
        <p className="text-xs font-semibold tracking-[0.18em] text-sky-400">
          THINKATS
        </p>
        <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">
          Log in to your hiring workspace.
        </h1>
        <p className="max-w-md text-sm text-slate-300">
          Access your pipelines, automations and analytics in one place. Use the
          same work email you used when your workspace was created.
        </p>
      </div>

      {/* Right side – form */}
      <div className="rounded-2xl bg-slate-950/40 p-5 sm:p-6 lg:p-7">
        <h2 className="mb-4 text-lg font-semibold">Log in</h2>
        <p className="mb-6 text-xs text-slate-300">
          Use your work email and password to continue.
        </p>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-200">
              Organisation / workspace (optional)
            </label>
            <input
              type="text"
              value={workspace}
              onChange={(e) => setWorkspace(e.target.value)}
              placeholder="resourcin, acme, client-name…"
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none ring-0 placeholder:text-slate-500 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            />
            <p className="text-[11px] text-slate-400">
              Helps us route you to the right tenant/workspace (coming soon).
            </p>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-200">
              Work email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none ring-0 placeholder:text-slate-500 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              placeholder="you@company.com"
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <label className="font-medium text-slate-200">Password</label>
              <a
                href="/auth/forgot"
                className="text-sky-400 hover:text-sky-300"
              >
                Forgot password?
              </a>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none ring-0 placeholder:text-slate-500 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            />
          </div>

          {errorMessage && (
            <p className="text-xs font-medium text-rose-400">{errorMessage}</p>
          )}
          {successMessage && (
            <p className="text-xs font-medium text-emerald-400">
              {successMessage}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 flex w-full items-center justify-center rounded-lg bg-sky-500 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting ? "Logging in…" : "Log in"}
          </button>

          <p className="mt-3 text-[11px] text-slate-400">
            Don&apos;t have access yet?{" "}
            <a href="/signup" className="text-sky-400 hover:text-sky-300">
              Request a workspace
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}
