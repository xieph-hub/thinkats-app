"use client";

import { useState, FormEvent } from "react";

type Status = "idle" | "submitting" | "success" | "error";

export default function RequestTalentPage() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  const [roleTitle, setRoleTitle] = useState("");
  const [roleLevel, setRoleLevel] = useState("");
  const [roleFunction, setRoleFunction] = useState("");
  const [location, setLocation] = useState("");
  const [workType, setWorkType] = useState("Hybrid");
  const [employmentType, setEmploymentType] = useState("Full-time");

  const [budgetCurrency, setBudgetCurrency] = useState("USD");
  const [budgetMin, setBudgetMin] = useState<string>("");
  const [budgetMax, setBudgetMax] = useState<string>("");
  const [hiresCount, setHiresCount] = useState<string>("1");

  const [notes, setNotes] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    setError(null);

    try {
      const res = await fetch("/api/request-talent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName,
          contactName,
          contactEmail,
          contactPhone,
          roleTitle,
          roleLevel: roleLevel || undefined,
          roleFunction: roleFunction || undefined,
          location: location || undefined,
          workType,
          employmentType,
          budgetCurrency: budgetCurrency || undefined,
          budgetMin: budgetMin ? Number(budgetMin) : undefined,
          budgetMax: budgetMax ? Number(budgetMax) : undefined,
          hiresCount: hiresCount ? Number(hiresCount) : undefined,
          notes: notes || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Failed to submit request");
      }

      setStatus("success");
      // Optionally reset form, but some people like to keep fields:
      // setCompanyName(""); setContactName(""); ...
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong");
      setStatus("error");
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-sky-600">
          For Employers
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
          Request talent
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Tell us what you&apos;re hiring for. We&apos;ll review your brief and
          respond with a shortlist plan, timelines, and fees.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        {/* Company & contact */}
        <section className="space-y-4">
          <h2 className="text-base font-semibold text-slate-900">
            Company & contact
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Company name *
              </label>
              <input
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Your name *
              </label>
              <input
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Work email *
              </label>
              <input
                type="email"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Phone / WhatsApp
              </label>
              <input
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="+234…"
              />
            </div>
          </div>
        </section>

        {/* Role */}
        <section className="space-y-4">
          <h2 className="text-base font-semibold text-slate-900">
            Role you&apos;re hiring for
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Role title *
              </label>
              <input
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                value={roleTitle}
                onChange={(e) => setRoleTitle(e.target.value)}
                placeholder="e.g. Head of Talent Acquisition, Senior Backend Engineer"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Seniority level
              </label>
              <input
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                value={roleLevel}
                onChange={(e) => setRoleLevel(e.target.value)}
                placeholder="Mid, Senior, Manager, Director..."
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Function
              </label>
              <input
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                value={roleFunction}
                onChange={(e) => setRoleFunction(e.target.value)}
                placeholder="Product, Engineering, Sales, HR..."
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Location
              </label>
              <input
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Lagos (Hybrid), Remote across Africa, etc."
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Work type
                </label>
                <select
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                  value={workType}
                  onChange={(e) => setWorkType(e.target.value)}
                >
                  <option>Onsite</option>
                  <option>Hybrid</option>
                  <option>Remote</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Employment type
                </label>
                <select
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                  value={employmentType}
                  onChange={(e) => setEmploymentType(e.target.value)}
                >
                  <option>Full-time</option>
                  <option>Contract</option>
                  <option>Interim / Fractional</option>
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* Budget & headcount */}
        <section className="space-y-4">
          <h2 className="text-base font-semibold text-slate-900">
            Budget & headcount
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Currency
              </label>
              <select
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                value={budgetCurrency}
                onChange={(e) => setBudgetCurrency(e.target.value)}
              >
                <option value="USD">USD</option>
                <option value="NGN">NGN</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Min salary / day rate
              </label>
              <input
                type="number"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                value={budgetMin}
                onChange={(e) => setBudgetMin(e.target.value)}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Max salary / day rate
              </label>
              <input
                type="number"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                value={budgetMax}
                onChange={(e) => setBudgetMax(e.target.value)}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Number of hires
              </label>
              <input
                type="number"
                min={1}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                value={hiresCount}
                onChange={(e) => setHiresCount(e.target.value)}
              />
            </div>
          </div>
        </section>

        {/* Notes */}
        <section className="space-y-4">
          <h2 className="text-base font-semibold text-slate-900">
            Anything else we should know?
          </h2>
          <textarea
            className="w-full min-h-[120px] rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Context, timelines, must-have experience, interview process, etc."
          />
        </section>

        {/* Status / submit */}
        <div className="flex items-center justify-between gap-4 pt-4 border-t border-slate-200">
          <div className="text-xs text-slate-500">
            By submitting, you&apos;re not committing to anything yet. We&apos;ll
            respond with options and a clear next step.
          </div>

          <button
            type="submit"
            disabled={status === "submitting"}
            className="inline-flex items-center justify-center rounded-full bg-sky-600 px-6 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {status === "submitting" ? "Submitting…" : "Submit brief"}
          </button>
        </div>

        {status === "success" && (
          <p className="text-sm text-emerald-600">
            Thank you. Your brief has been received – we&apos;ll review and
            respond shortly.
          </p>
        )}

        {status === "error" && error && (
          <p className="text-sm text-red-600">Error: {error}</p>
        )}
      </form>
    </main>
  );
}
