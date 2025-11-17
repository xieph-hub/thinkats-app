// app/login/LoginClient.tsx
"use client";

import { FormEvent, useState } from "react";

type Mode = "candidate" | "client";
type Status = "idle" | "submitting" | "success" | "error";

export default function LoginClient() {
  const [mode, setMode] = useState<Mode>("candidate");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function handleCandidateSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    setMessage(null);

    const formData = new FormData(e.currentTarget);
    const email = String(formData.get("email") || "");

    try {
      const res = await fetch("/api/candidate/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Could not send login link.");
      }

      setStatus("success");
      setMessage(
        "If this email is in our system, we’ve sent a secure login link. Please check your inbox."
      );
      e.currentTarget.reset();
    } catch (err: any) {
      console.error(err);
      setStatus("error");
      setMessage(err.message || "Something went wrong. Please try again.");
    }
  }

  return (
    <main className="bg-slate-50 min-h-screen">
      <section className="mx-auto max-w-md px-4 py-12 sm:px-6 lg:px-8">
        <header className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#306B34]">
            Access portal
          </p>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            Login
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Candidates use a secure email link. Client access will be available
            shortly.
          </p>
        </header>

        {/* Tabs */}
        <div className="mb-4 inline-flex rounded-full bg-slate-100 p-1 text-xs font-medium">
          <button
            type="button"
            onClick={() => setMode("candidate")}
            className={`rounded-full px-4 py-1.5 ${
              mode === "candidate"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500"
            }`}
          >
            Candidate
          </button>
          <button
            type="button"
            onClick={() => setMode("client")}
            className={`rounded-full px-4 py-1.5 ${
              mode === "client"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500"
            }`}
          >
            Client (coming soon)
          </button>
        </div>

        {mode === "candidate" ? (
          <form
            onSubmit={handleCandidateSubmit}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4"
          >
            <div>
              <label className="block text-xs font-medium text-slate-700">
                Work email
              </label>
              <input
                name="email"
                type="email"
                required
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#172965]"
                placeholder="you@company.com"
              />
            </div>

            <p className="text-xs text-slate-500">
              We&apos;ll email you a one-time, secure link to access your
              profile and applications. No passwords to remember.
            </p>

            <button
              type="submit"
              disabled={status === "submitting"}
              className="inline-flex w-full items-center justify-center rounded-full bg-[#172965] px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#101b47] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {status === "submitting" ? "Sending link…" : "Send login link"}
            </button>

            {message && (
              <div
                className={`rounded-lg px-3 py-2 text-xs ${
                  status === "success"
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-amber-50 text-amber-700"
                }`}
              >
                {message}
              </div>
            )}
          </form>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-sm">
            Client access will allow you to view pipelines, shortlist, and give
            structured feedback. For now, we handle this directly with you.
          </div>
        )}
      </section>
    </main>
  );
}
