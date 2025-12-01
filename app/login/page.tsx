// app/login/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

type Status = "idle" | "loading" | "error" | "success";

export default function LoginPage() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setMessage(null);

    const form = e.currentTarget;
    const formData = new FormData(form);

    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");
    const workspace = String(formData.get("workspace") || "").trim();

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

    // For now, we just pass the workspace/tenant hint as a query param.
    // Later you can resolve this into a real tenantId server-side.
    const basePath = "/ats/jobs";
    const nextUrl =
      workspace.length > 0
        ? `${basePath}?tenant=${encodeURIComponent(workspace)}`
        : basePath;

    router.push(nextUrl);
  }

  async function handleSSO(provider: "google" | "azure") {
    try {
      setStatus("loading");
      setMessage(null);

      const redirectTo = `${window.location.origin}/ats/jobs`;

      const { error } = await supabaseBrowser.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo,
        },
      });

      if (error) {
        setStatus("error");
        setMessage(
          error.message || "Unable to start single sign-on. Please try again."
        );
        return;
      }

      // Supabase will handle the redirect; we don't need to do anything else here.
    } catch (err) {
      setStatus("error");
      setMessage("Unable to start single sign-on. Please try again.");
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-4 py-12 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-center">
          {/* Left: brand & copy */}
          <div>
            <div className="mb-6 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
              THINKATS
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              Sign in to your hiring workspace
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              Access roles, pipelines and your talent network across every
              client and business unit. Use the work email and SSO your
              organisation has set up with ThinkATS.
            </p>

            <div className="mt-8 space-y-3 text-sm text-slate-600">
              <p>
                <span className="font-medium text-slate-800">
                  Trouble signing in?
                </span>{" "}
                Contact your organisation’s ThinkATS administrator to confirm
                your access, or{" "}
                <Link
                  href="/contact"
                  className="font-medium text-slate-900 underline underline-offset-4"
                >
                  talk to our team about getting set up
                </Link>
                .
              </p>
            </div>
          </div>

          {/* Right: login card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-base font-semibold text-slate-900">
              Sign in
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Continue with your company SSO or work email.
            </p>

            {/* SSO buttons */}
            <div className="mt-5 space-y-3">
              <button
                type="button"
                onClick={() => handleSSO("azure")}
                disabled={status === "loading"}
                className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 shadow-sm hover:bg-slate-50 disabled:opacity-60"
              >
                {/* You can swap these placeholders for real icons later */}
                <span className="inline-block h-4 w-4 rounded-sm bg-slate-900" />
                <span>Sign in with Microsoft</span>
              </button>

              <button
                type="button"
                onClick={() => handleSSO("google")}
                disabled={status === "loading"}
                className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-100 disabled:opacity-60"
              >
                <span className="inline-block h-4 w-4 rounded-full bg-slate-900" />
                <span>Sign in with Google</span>
              </button>
            </div>

            {/* Divider */}
            <div className="mt-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-[11px] uppercase tracking-[0.16em] text-slate-400">
                or continue with email
              </span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            {/* Email + password + workspace */}
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label
                  htmlFor="workspace"
                  className="block text-xs font-medium uppercase tracking-wide text-slate-500"
                >
                  Organisation / workspace (optional)
                </label>
                <input
                  id="workspace"
                  name="workspace"
                  type="text"
                  autoComplete="organization"
                  placeholder="e.g. resourcin, acme, client-name"
                  className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
                <p className="mt-1 text-[11px] text-slate-400">
                  This helps us route you to the right tenant. You can use a
                  workspace name or short slug agreed with your account team.
                </p>
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-xs font-medium uppercase tracking-wide text-slate-500"
                >
                  Work email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  placeholder="you@company.com"
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="block text-xs font-medium uppercase tracking-wide text-slate-500"
                  >
                    Password
                  </label>
                  <Link
                    href="/auth/reset"
                    className="text-xs font-medium text-slate-700 hover:text-slate-900"
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
                  className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={status === "loading"}
                className="mt-2 inline-flex w-full items-center justify-center rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800 disabled:opacity-60"
              >
                {status === "loading" ? "Signing in…" : "Sign in"}
              </button>

              {status === "error" && message && (
                <p className="mt-3 text-xs text-red-600">{message}</p>
              )}
              {status === "success" && message && (
                <p className="mt-3 text-xs text-emerald-700">{message}</p>
              )}
            </form>

            <div className="mt-6 border-t border-slate-100 pt-4 text-xs text-slate-500">
              <p>
                By signing in, you agree to any applicable agreements your
                organisation has in place with ThinkATS.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
