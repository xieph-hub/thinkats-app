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

    const payload = {
      name: (formData.get("name") || "").toString().trim(),
      email: (formData.get("email") || "").toString().trim(),
      company: (formData.get("company") || "").toString().trim(),
      role: (formData.get("role") || "").toString().trim(),
      message: (formData.get("message") || "").toString().trim(),
    };

    if (!payload.name || !payload.email || !payload.message) {
      setStatus("error");
      setMessage("Please fill in your name, work email and a short message.");
      return;
    }

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
      };

      if (!res.ok || data.ok === false) {
        throw new Error(data.error || "Failed to send message");
      }

      setStatus("success");
      setMessage("Thanks for reaching out. We’ll get back to you shortly.");
      e.currentTarget.reset();
    } catch (err) {
      console.error("Contact form error:", err);
      setStatus("error");
      setMessage(
        "We couldn’t send your message right now. Please try again, or email us directly.",
      );
    }
  }

  return (
    <main className="bg-slate-950 text-slate-50">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-4xl flex-col justify-center px-6 py-16">
        <header className="space-y-3">
          <p className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-sky-500/10 text-[10px] text-sky-300">
              ●
            </span>
            Contact
          </p>
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Talk to the ThinkATS team.
          </h1>
          <p className="max-w-xl text-sm text-slate-300">
            Tell us a bit about your hiring setup and we&apos;ll share how
            ThinkATS can help you run cleaner pipelines, career sites and
            automations across tenants and clients.
          </p>
        </header>

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
                placeholder="Adaobi Okafor"
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

          <div className="grid gap-4 md:grid-cols-2">
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
                ROLE / TITLE
              </label>
              <input
                name="role"
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                placeholder="Head of Talent, Founder, etc."
              />
            </div>
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
              placeholder="Share your current hiring process, tools, tenant setup and where ThinkATS could help."
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
