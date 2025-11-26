// app/ats/jobs/new/JobCreateForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ClientCompany = {
  id: string;
  name: string;
};

type Props = {
  clientCompanies: ClientCompany[];
};

export function JobCreateForm({ clientCompanies }: Props) {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [clientCompanyId, setClientCompanyId] = useState<string | "">("");
  const [location, setLocation] = useState("");
  const [employmentType, setEmploymentType] = useState("");
  const [seniority, setSeniority] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [isPublished, setIsPublished] = useState(false);
  const [isConfidential, setIsConfidential] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/ats/jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          slug: slug || undefined,
          clientCompanyId: clientCompanyId || null,
          location,
          employmentType: employmentType || null,
          seniority: seniority || null,
          description,
          isPublic,
          isPublished,
          isConfidential,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to create job");
      }

      const data = await res.json();
      const jobId = data.job?.id;

      if (!jobId) {
        throw new Error("Job created but ID missing in response");
      }

      router.push(`/ats/jobs/${jobId}`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title & slug */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <label className="block text-sm font-medium text-slate-700">
            Job title *
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-resourcin-blue focus:outline-none focus:ring-1 focus:ring-resourcin-blue"
            placeholder="e.g. Deputy Medical Director"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-slate-700">
            Slug (optional)
          </label>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-resourcin-blue focus:outline-none focus:ring-1 focus:ring-resourcin-blue"
            placeholder="deputy-medical-director"
          />
          <p className="text-xs text-slate-400">
            Leave blank to auto-generate from title.
          </p>
        </div>
      </div>

      {/* Client, location */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <label className="block text-sm font-medium text-slate-700">
            Client company
          </label>
          <select
            value={clientCompanyId}
            onChange={(e) => setClientCompanyId(e.target.value)}
            className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-resourcin-blue focus:outline-none focus:ring-1 focus:ring-resourcin-blue"
          >
            <option value="">Resourcin-branded role</option>
            {clientCompanies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-slate-400">
            Leave as “Resourcin-branded” for in-house or anonymous searches.
          </p>
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-slate-700">
            Location
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-resourcin-blue focus:outline-none focus:ring-1 focus:ring-resourcin-blue"
            placeholder="e.g. Lagos, Hybrid, Remote – Nigeria"
          />
        </div>
      </div>

      {/* Employment type & seniority */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <label className="block text-sm font-medium text-slate-700">
            Employment type
          </label>
          <select
            value={employmentType}
            onChange={(e) => setEmploymentType(e.target.value)}
            className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-resourcin-blue focus:outline-none focus:ring-1 focus:ring-resourcin-blue"
          >
            <option value="">Select...</option>
            <option value="FULL_TIME">Full time</option>
            <option value="PART_TIME">Part time</option>
            <option value="CONTRACT">Contract</option>
            <option value="INTERN">Internship</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-slate-700">
            Seniority
          </label>
          <input
            type="text"
            value={seniority}
            onChange={(e) => setSeniority(e.target.value)}
            className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-resourcin-blue focus:outline-none focus:ring-1 focus:ring-resourcin-blue"
            placeholder="e.g. Senior, Lead, Manager"
          />
        </div>
      </div>

      {/* Description */}
      <div className="space-y-1">
        <label className="block text-sm font-medium text-slate-700">
          Description
        </label>
        <textarea
          rows={6}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-resourcin-blue focus:outline-none focus:ring-1 focus:ring-resourcin-blue"
          placeholder="Paste or write the full job description here."
        />
      </div>

      {/* Flags */}
      <div className="grid gap-4 md:grid-cols-3">
        <label className="flex items-start gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-resourcin-blue focus:ring-resourcin-blue"
          />
          <span>
            Public job
            <span className="block text-xs text-slate-500">
              When published, this can appear on the public jobs page.
            </span>
          </span>
        </label>

        <label className="flex items-start gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-resourcin-blue focus:ring-resourcin-blue"
          />
          <span>
            Published
            <span className="block text-xs text-slate-500">
              Marks the role as live externally (if public).
            </span>
          </span>
        </label>

        <label className="flex items-start gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={isConfidential}
            onChange={(e) => setIsConfidential(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-resourcin-blue focus:ring-resourcin-blue"
          />
          <span>
            Confidential search
            <span className="block text-xs text-slate-500">
              Hides client name/logo on public pages while still tracked in ATS.
            </span>
          </span>
        </label>
      </div>

      {/* Error + submit */}
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => router.push("/ats/jobs")}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          disabled={submitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-resourcin-blue px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-900 disabled:opacity-60"
        >
          {submitting ? "Creating…" : "Create job"}
        </button>
      </div>
    </form>
  );
}
