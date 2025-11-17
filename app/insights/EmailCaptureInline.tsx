// app/insights/EmailCaptureInline.tsx
"use client";

import { useState, FormEvent } from "react";

export default function EmailCaptureInline() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus("loading");
    setMessage(null);

    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          source: "insights",
        }),
      });

      if (!res.ok) {
        throw new Error("Request failed");
      }

      setStatus("success");
      setMessage(
        "You’re in. We’ll only send practical, high-signal updates."
      );
      setEmail("");
    } catch (err) {
      setStatus("error");
      setMessage("Something went wrong. Please try again in a bit.");
    }
  };

  return (
    <section className="overflow-hidden rounded-3xl border border-[#1729651a] bg-gradient-to-r from-[#000435] via-[#172965] to-[#306B34] px-4 py-6 text-white shadow-sm sm:px-6 sm:py-7 lg:px-8">
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="max-w-xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#FFC000]">
            Stay sharp on hiring & talent
          </p>
          <h2 className="mt-2 text-xl font-semibold leading-snug sm:text-2xl">
            Get Resourcin insights in your inbox.
          </h2>
          <p className="mt-2 text-[13px] text-slate-100/85 sm:text-[14px]">
            No fluff, no spam—just practical thinking on senior hiring,
            interview design, compensation, and the realities of the
            talent market.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-3 w-full max-w-sm md:mt-0"
        >
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full rounded-full border border-white/20 bg-white/10 px-4 py-2.5 text-sm text-white placeholder:text-slate-200/70 focus:border-[#FFC000] focus:outline-none focus:ring-1 focus:ring-[#FFC000]"
              />
            </div>
            <button
              type="submit"
              disabled={status === "loading"}
              className="inline-flex items-center justify-center rounded-full bg-[#FFC000] px-5 py-2.5 text-sm font-semibold text-[#000435] shadow-sm transition hover:bg-[#ffcf33] disabled:cursor-not-allowed disabled:opacity-80"
            >
              {status === "loading" ? "Subscribing…" : "Get updates"}
            </button>
          </div>
          {message && (
            <p
              className={
                "mt-2 text-[11px] " +
                (status === "error"
                  ? "text-red-100"
                  : "text-slate-100/80")
              }
            >
              {message}
            </p>
          )}
        </form>
      </div>
    </section>
  );
}
