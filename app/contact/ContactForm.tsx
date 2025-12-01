// app/contact/ContactForm.tsx
"use client";

import { useState } from "react";

type Status = "idle" | "submitting" | "success" | "error";

export default function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    setErrorMessage(null);

    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      // 🔧 If you have an API route like /api/contact, call it here:
      // const res = await fetch("/api/contact", {
      //   method: "POST",
      //   body: formData,
      // });
      // if (!res.ok) throw new Error("Failed to send message");

      // For now, just simulate success:
      await new Promise((resolve) => setTimeout(resolve, 800));

      setStatus("success");
      form.reset();
    } catch (err) {
      console.error(err);
      setStatus("error");
      setErrorMessage(
        "We couldn’t send your message. Please try again, or email us directly."
      );
    } finally {
      setStatus((prev) => (prev === "success" ? "success" : "idle"));
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6"
      autoComplete="on"
      noValidate
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-slate-200">
            Full name
          </label>
          <input
            name="name"
            type="text"
            required
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-500"
            placeholder="Adaobi Okafor"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-slate-200">
            Work email
          </label>
          <input
            name="email"
            type="email"
            required
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-500"
            placeholder="you@company.com"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-slate-200">
            Company
          </label>
          <input
            name="company"
            type="text"
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-500"
            placeholder="Acme Inc."
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-slate-200">
            Role / title
          </label>
          <input
            name="role"
            type="text"
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-500"
            placeholder="Head of Talent"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs font-medium text-slate-200">
          What do you want to solve?
        </label>
        <textarea
          name="message"
          required
          rows={4}
          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-500"
          placeholder="Share your current hiring process, tools, and where ThinkATS could help."
        />
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <button
          type="submit"
          disabled={status === "submitting"}
          className="inline-flex items-center justify-center rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-medium text-slate-950 shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {status === "submitting" ? "Sending…" : "Send message"}
        </button>

        {status === "success" && (
          <p className="text-xs text-emerald-300">
            Message received. We&apos;ll get back to you shortly.
          </p>
        )}

        {status === "error" && (
          <p className="text-xs text-red-400">
            {errorMessage ??
              "Something went wrong. Please try again in a moment."}
          </p>
        )}
      </div>
    </form>
  );
}
