// app/login/LoginPageClient.tsx
"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Status = "idle" | "loading" | "error";

type Props = {
  callbackUrl: string;
};

export default function LoginPageClient({ callbackUrl }: Props) {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setError(null);

    try {
      const res = await fetch(
        `/api/auth/login?callbackUrl=${encodeURIComponent(callbackUrl)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: email.trim(),
            password,
          }),
        },
      );

      const data = (await res.json().catch(() => ({}))) as {
        success?: boolean;
        redirectTo?: string;
        error?: string;
      };

      if (!res.ok || !data.success) {
        setStatus("error");
        setError(data.error || "Invalid email or password.");
        return;
      }

      // server returns redirectTo or we fall back to callbackUrl
      router.push(data.redirectTo || callbackUrl);
    } catch {
      setStatus("error");
      setError("Something went wrong. Please try again.");
    } finally {
      setStatus((prev) => (prev === "loading" ? "idle" : prev));
    }
  }

  return (
    <>
      <header className="pb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
          Sign in
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
          Sign in to your ATS workspace.
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-600">
          Use the work email you registered with. After signing in, we&apos;ll
          ask for a one-time code to unlock the ATS.
        </p>
      </header>

      <section className="lg:max-w-md">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-[11px] font-medium uppercase tracking-wide text-slate-500"
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
                className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="you@company.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-[11px] font-medium uppercase tracking-wide text-slate-500"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="text-[11px] text-red-500">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={status === "loading"}
              className="mt-2 inline-flex w-full items-center justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {status === "loading" ? "Signing you in…" : "Sign in"}
            </button>
          </form>

          <p className="mt-4 text-[11px] text-slate-500">
            Forgot your password?{" "}
            <Link
              href="/auth/forgot"
              className="font-medium text-indigo-600 underline underline-offset-4 hover:text-indigo-700"
            >
              Reset it
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}
