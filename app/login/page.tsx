// app/login/page.tsx
"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

type Status = "idle" | "loading" | "error" | "success";

export default function LoginPage() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setMessage(null);

    const form = e.currentTarget;
    const formData = new FormData(form);

    const workspace = String(formData.get("workspace") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");

    if (!email || !password) {
      setStatus("error");
      setMessage("Email and password are required.");
      return;
    }

    const { data, error } = await supabaseBrowser.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.session) {
      setStatus("error");
      setMessage(error?.message || "Invalid email or password.");
      return;
    }

    setStatus("success");
    setMessage("Signed in successfully. Redirecting…");

    const basePath = "/ats/jobs";
    const next =
      workspace.length > 0
        ? `${basePath}?tenant=${encodeURIComponent(workspace)}`
        : basePath;

    router.push(next);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-10 sm:py-14 lg:px-10">
        {/* Top bar */}
        <header className="flex items-center justify-between pb-10">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100">
              <span className="text-xs font-bold tracking-tight text-slate-900">
                TA
              </span>
            </div>
            <span className="text-sm font-semibold tracking-tight text-slate-50">
              ThinkATS
            </span>
          </Link>

          <Link
            href="/signup"
            className="hidden rounded-full border border-slate-600 px-3 py-1.5 text-xs font-medium text-slate-100 hover:border-slate-400 sm:inline-flex"
          >
            Start free trial
          </Link>
        </header>

        <div className="grid flex-1 items-center gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
          {/* Left narrative */}
          <section>
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/60 px-3 py-1 text-[11px] text-slate-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span>Multi-tenant ATS for agencies & in-house teams</span>
            </div>

            <h1 className="mt-5 text-3xl font-semibold tracking-tight text-slate-50 sm:text-4xl lg:text-5xl">
              Sign in to your hiring workspace.
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-slate-300">
              Move roles, pipelines and talent pools in one place. Use the work
              email your organisation has configured with ThinkATS.
            </p>

            <ul className="mt-6 space-y-3 text-sm text-slate-200/90">
              <li className="flex items-start gap-2">
                <span className="mt-[5px] h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span>Separate workspaces for every client or business unit.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-[5px] h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span>Shared talent network across all open and past roles.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-[5px] h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span>Clear visibility for founders, people teams and hiring managers.</span>
              </li>
            </ul>

            <p className="mt-8 text-xs text-slate-400">
              Trouble signing in? Contact your organisation’s ThinkATS
              administrator, or{" "}
              <Link
                href="/contact"
                className="font-medium text-slate-100 underline underline-offset-4"
              >
                talk to our team about getting set up
              </Link>
              .
            </p>
          </section>

          {/* Right: email login card */}
          <section className="lg:justify-self-end">
            <div className="w-full max-w-md rounded-2xl border border-slate-700/70 bg-slate-950/70 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.7)] backdrop-blur">
              <h2 className="text-base font-semibold text-slate-50">Sign in</h2>
              <p className="mt-1 text-xs text-slate-400">
                Use your work email and password to continue.
              </p>

              <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                <div>
                  <label
                    htmlFor="workspace"
                    className="block text-[11px] font-medium uppercase tracking-wide text-slate-400"
                  >
                    Organisation / workspace (optional)
                  </label>
                  <input
                    id="workspace"
                    name="workspace"
                    type="text"
                    autoComplete="organization"
                    placeholder="resourcin, acme, client-name…"
                    className="mt-1 block w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                  <p className="mt-1 text-[10px] text-slate-500">
                    Helps us route you to the right tenant/workspace.
                  </p>
                </div>

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
                    autoComplete="email"
                    className="mt-1 block w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                    placeholder="you@company.com"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="password"
                      className="block text-[11px] font-medium uppercase tracking-wide text-slate-400"
                    >
                      Password
                    </label>
                    <Link
                      href="/auth/reset"
                      className="text-[11px] font-medium text-slate-200 hover:text-slate-50"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    autoComplete="current-password"
                    className="mt-1 block w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                    placeholder="••••••••"
                  />
                </div>

                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="mt-2 inline-flex w-full items-center justify-center rounded-md bg-sky-500 px-3 py-2 text-sm font-medium text-slate-950 shadow-sm hover:bg-sky-400 disabled:opacity-60"
                >
                  {status === "loading" ? "Signing in…" : "Sign in"}
                </button>

                {status === "error" && message && (
                  <p className="mt-3 text-[11px] text-red-400">{message}</p>
                )}
                {status === "success" && message && (
                  <p className="mt-3 text-[11px] text-emerald-400">
                    {message}
                  </p>
                )}
              </form>

              <p className="mt-5 text-center text-[11px] text-slate-500">
                Don’t have access yet?{" "}
                <Link
                  href="/signup"
                  className="font-medium text-slate-100 underline underline-offset-4"
                >
                  Request a workspace
                </Link>
              </p>

              <p className="mt-3 text-[10px] text-slate-500">
                By signing in, you agree to any applicable agreements your
                organisation has in place with ThinkATS.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
