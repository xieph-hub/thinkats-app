// app/contact/ContactClient.tsx
"use client";

import { useState } from "react";

type Status = "idle" | "loading" | "success" | "error";

export default function ContactClient() {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);

  const isLoading = status === "loading";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setMessage(null);

    const formData = new FormData(e.currentTarget);
    const name = (formData.get("name") || "").toString();
    const email = (formData.get("email") || "").toString();
    const company = (formData.get("company") || "").toString();
    const body = (formData.get("message") || "").toString();

    try {
      // TODO: wire this to a real endpoint when you're ready
      // For now we just simulate success so the page builds cleanly.
      console.log("Contact form submit", { name, email, company, body });

      setStatus("success");
      setMessage("Thanks for reaching out. We’ll get back to you shortly.");
      e.currentTarget.reset();
    } catch (err) {
      console.error("Contact form error:", err);
      setStatus("error");
      setMessage(
        "We couldn’t send your message right now. Please try again in a moment."
      );
    }
  }

  return (
    <main className="bg-slate-950 text-slate-50">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-4xl flex-col justify-center px-6 py-16">
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          Talk to the ThinkATS team.
        </h1>
        <p className="mt-3 max-w-xl text-sm text-slate-300">
          Tell us a bit about your hiring setup and we&apos;ll share how
          ThinkATS can help you run cleaner pipelines, career sites and
          automations.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-5 rounded-2xl border border-slate-800 bg-slate-900/70 p-8 shadow-xl"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-300">
                FULL NAME
              </label>
              <input
                name="name"
                required
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                placeholder="Jane Doe"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-300">
                WORK EMAIL
              </label>
              <input
                name="email"
                type="email"
                required
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                placeholder="you@company.com"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-300">
              COMPANY
            </label>
            <input
              name="company"
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              placeholder="Company name"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-300">
              HOW CAN WE HELP?
            </label>
            <textarea
              name="message"
              required
              rows={4}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              placeholder="Tell us about your hiring challenges, team size, and timelines."
            />
          </div>

          {message && (
            <p
              className={`text-[11px] ${
                status === "error"
                  ? "text-rose-400"
                  : status === "success"
                  ? "text-emerald-400"
                  : "text-slate-400"
              }`}
            >
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center justify-center rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isLoading ? "Sending…" : "Send message"}
          </button>
        </form>
      </div>
    </main>
  );
}
