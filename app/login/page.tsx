// app/login/page.tsx
"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formMessage, setFormMessage] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    setFormMessage(null);
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const password = String(formData.get("password") ?? "");

    if (!email || !password) {
      setFormError("Please enter your work email and password.");
      setIsSubmitting(false);
      return;
    }

    const { data, error } = await supabaseBrowser.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.session) {
      setFormError(
        error?.message ??
          "We couldn't log you in. Check your details and try again."
      );
      setIsSubmitting(false);
      return;
    }

    setFormMessage("Logged in successfully. Redirecting…");

    // Where to go next
    const callbackParam = searchParams.get("callbackUrl");
    const callbackPath =
      callbackParam && callbackParam.startsWith("/")
        ? callbackParam
        : "/ats";

    // Allow the success text to paint, then navigate
    setTimeout(() => {
      router.push(callbackPath);
      router.refresh();
    }, 150);
  }

  async function handleForgotPassword() {
    setFormError(null);
    setFormMessage(null);

    const emailInput = document.querySelector<HTMLInputElement>(
      'input[name="email"]'
    );
    const email = emailInput?.value.trim().toLowerCase() ?? "";

    if (!email) {
      setFormError(
        "Enter your work email first, then click “Forgot password?”."
      );
      return;
    }

    try {
      const baseUrl =
        process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.thinkats.com";

      const { error } = await supabaseBrowser.auth.resetPasswordForEmail(
        email,
        {
          redirectTo: `${baseUrl}/auth/reset`,
        }
      );

      if (error) {
        setFormError(error.message);
        return;
      }

      setFormMessage(
        "Reset link sent. Check your inbox and follow the instructions."
      );
    } catch (err) {
      console.error("Forgot password error", err);
      setFormError("Something went wrong while sending the reset link.");
    }
  }

  return (
    <div className="bg-slate-950 text-slate-50">
      <div className="mx-auto flex min-h-[calc(100vh-72px-72px)] max-w-6xl flex-col gap-10 px-4 py-10 sm:px-6 lg:flex-row lg:px-8">
        {/* Left copy block */}
        <section className="flex-1">
          <p className="text-xs font-semibold tracking-[0.2em] text-sky-400">
            THINKATS
          </p>
          <h1 className="mt-3 max-w-xl text-3xl font-semibold sm:text-4xl">
            Log in to your hiring workspace.
          </h1>
          <p className="mt-4 max-w-md text-sm text-slate-300 sm:text-base">
            Access your pipelines, automations and analytics in one place. Use
            the same work email you used when your workspace was created.
          </p>

          <p className="mt-6 text-xs text-slate-400">
            Don&apos;t have a workspace yet?{" "}
            <Link
              href="/signup"
              className="font-semibold text-sky-400 hover:text-sky-300"
            >
              Start a free trial
            </Link>
            .
          </p>
        </section>

        {/* Right auth card */}
        <section className="flex-1">
          <div className="mx-auto max-w-md rounded-2xl bg-slate-900/70 p-6 shadow-xl ring-1 ring-slate-800">
            <h2 className="text-lg font-semibold text-slate-50">Log in</h2>
            <p className="mt-1 text-xs text-slate-400">
              Use your work email and password to continue.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label
                  htmlFor="organisation"
                  className="block text-xs font-medium text-slate-300"
                >
                  Organisation / workspace (optional)
                </label>
                <input
                  id="organisation"
                  name="organisation"
                  type="text"
                  autoComplete="organization"
                  placeholder="resourcin, acme, client-name..."
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
                <p className="mt-1 text-[11px] text-slate-500">
                  Helps us route you to the right tenant/workspace (coming
                  soon).
                </p>
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-xs font-medium text-slate-300"
                >
                  Work email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  placeholder="you@company.com"
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="block text-xs font-medium text-slate-300"
                  >
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-[11px] font-medium text-sky-400 hover:text-sky-300"
                  >
                    Forgot password?
                  </button>
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  placeholder="••••••••"
                />
              </div>

              {formError && (
                <p className="text-xs font-medium text-rose-400">
                  {formError}
                </p>
              )}
              {formMessage && !formError && (
                <p className="text-xs font-medium text-emerald-400">
                  {formMessage}
                </p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-2 flex w-full items-center justify-center rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? "Logging in..." : "Log in"}
              </button>
            </form>

            <p className="mt-4 text-[11px] text-slate-500">
              Don&apos;t have access yet?{" "}
              <Link
                href="/signup"
                className="font-medium text-sky-400 hover:text-sky-300"
              >
                Request a workspace
              </Link>
              .
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
