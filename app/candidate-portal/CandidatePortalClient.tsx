// app/candidate-portal/CandidatePortalClient.tsx
"use client";

import { FormEvent, useState } from "react";

type CandidateApplication = {
  id: string;
  createdAt: string; // ISO
  jobTitle: string;
  clientName: string | null;
  stage: string;
  status: string;
};

export default function CandidatePortalClient() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [applications, setApplications] = useState<CandidateApplication[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  function formatDate(iso: string) {
    const d = new Date(iso);
    return d.toLocaleDateString("en-NG", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setHasSearched(true);

    if (!email.trim()) {
      setError("Please enter the email you applied with.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(
        `/api/candidate-applications?email=${encodeURIComponent(email.trim())}`
      );

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.error || "Could not load applications.");
        setApplications([]);
        return;
      }

      const body = await res.json();
      setApplications(body.applications || []);
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
      setApplications([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <form
        onSubmit={handleSubmit}
        className="grid gap-3 rounded-xl bg-slate-50 px-4 py-3 sm:grid-cols-[minmax(0,1.5fr)_minmax(0,0.8fr)_auto]"
      >
        <div className="sm:col-span-1">
          <label className="block text-xs font-medium text-slate-700">
            Email you applied with
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#172965]"
          />
        </div>
        <div className="sm:col-span-1">
          <p className="mt-5 text-[11px] text-slate-500 sm:mt-[26px]">
            We’ll look for applications that used this email address and show
            roles, stages and status.
          </p>
        </div>
        <div className="sm:col-span-1 flex items-end justify-start sm:justify-end">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center rounded-full bg-[#172965] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#111c4c] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Checking…" : "View applications"}
          </button>
        </div>
      </form>

      {error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}

      {hasSearched && !loading && !error && applications.length === 0 && (
        <p className="text-xs text-slate-500">
          We couldn&apos;t find any applications linked to{" "}
          <span className="font-medium text-slate-700">{email}</span>. Check
          that you&apos;re using the same email you applied with.
        </p>
      )}

      {applications.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-slate-500">
            Found {applications.length} application
            {applications.length > 1 ? "s" : ""} linked to{" "}
            <span className="font-medium text-slate-700">{email}</span>.
          </p>
          <ul className="space-y-3">
            {applications.map((app) => (
              <li
                key={app.id}
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm"
              >
                <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">
                      {app.jobTitle}
                    </p>
                    <p className="text-xs text-slate-500">
                      {app.clientName ?? "Resourcin network"} • Applied{" "}
                      {formatDate(app.createdAt)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="inline-flex items-center rounded-full bg-slate-50 px-2.5 py-1 text-[0.7rem] font-medium text-slate-700 ring-1 ring-slate-200">
                      Stage: {app.stage}
                    </span>
                    <span className="inline-flex items-center rounded-full bg-slate-900 px-2.5 py-1 text-[0.7rem] font-medium text-white">
                      Status: {app.status}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
