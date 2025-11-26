"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type ClientCompanyOption = {
  id: string;
  name: string;
  slug: string | null;
  logoUrl: string | null;
};

type JobCreateFormProps = {
  clientCompanies: ClientCompanyOption[];
};

type CreateJobResponse = {
  id?: string;
  slug?: string | null;
  error?: string;
};

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-"
    )
    .replace(/^-+|-+$/g, "");
}

const JobCreateForm: React.FC<JobCreateFormProps> = ({ clientCompanies }) => {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [location, setLocation] = useState("");
  const [department, setDepartment] = useState("");
  const [employmentType, setEmploymentType] = useState("");
  const [seniority, setSeniority] = useState("");
  const [workMode, setWorkMode] = useState(""); // remote / hybrid / onsite

  const [clientCompanyId, setClientCompanyId] = useState<string>("");

  const [visibility, setVisibility] = useState<"public" | "internal" | "confidential">(
    "public"
  );
  const [isConfidential, setIsConfidential] = useState(false);
  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedClient = useMemo(
    () => clientCompanies.find((c) => c.id === clientCompanyId) || null,
    [clientCompanies, clientCompanyId]
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const finalSlug = slug || slugify(title);

      const payload: any = {
        title,
        slug: finalSlug,
        location,
        department,
        employmentType,
        seniority,
        workMode,
        visibility,
        confidential: isConfidential,
        shortDescription,
        description,
      };

      if (clientCompanyId) {
        payload.clientCompanyId = clientCompanyId;
      }

      const res = await fetch("/api/ats/jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = (await res.json().catch(() => ({}))) as CreateJobResponse;

      if (!res.ok) {
        throw new Error(data.error || "Failed to create job.");
      }

      if (data.id) {
        router.push(`/ats/jobs/${data.id}`);
      } else {
        router.push("/ats/jobs");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to create job. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}

      {/* Title */}
      <div className="space-y-1">
        <label className="block text-xs font-medium text-slate-700">
          Job title *
        </label>
        <input
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="block w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
        />
      </div>

      {/* Slug */}
      <div className="space-y-1">
        <label className="block text-xs font-medium text-slate-700">
          Slug (optional)
        </label>
        <input
          type="text"
          placeholder="will be generated from title if empty"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          className="block w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
        />
      </div>

      {/* Client company + logo */}
      <div className="space-y-2">
        <div className="space-y-1">
          <label className="block text-xs font-medium text-slate-700">
            Client (optional)
          </label>
          <select
            value={clientCompanyId}
            onChange={(e) => setClientCompanyId(e.target.value)}
            className="block w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
          >
            <option value="">No specific client (Resourcin / internal)</option>
            {clientCompanies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {selectedClient && selectedClient.logoUrl && (
          <div className="flex items-center gap-2 rounded-md border border-slate-100 bg-slate-50 px-2.5 py-2">
            <img
              src={selectedClient.logoUrl}
              alt={selectedClient.name}
              className="h-8 w-8 rounded border border-slate-200 bg-white object-contain"
            />
            <div className="flex flex-col">
              <span className="text-xs font-medium text-slate-800">
                {selectedClient.name}
              </span>
              <span className="text-[11px] text-slate-500">
                Logo preview for this mandate
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Location + department */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="block text-xs font-medium text-slate-700">
            Location
          </label>
          <input
            type="text"
            placeholder="Lagos, Nigeria"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="block w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-medium text-slate-700">
            Department / Function
          </label>
          <input
            type="text"
            placeholder="Operations, Finance, Engineering..."
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="block w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
          />
        </div>
      </div>

      {/* Employment type / seniority / work mode */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1">
          <label className="block text-xs font-medium text-slate-700">
            Employment type
          </label>
          <input
            type="text"
            placeholder="Full-time, Contract..."
            value={employmentType}
            onChange={(e) => setEmploymentType(e.target.value)}
            className="block w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-medium text-slate-700">
            Seniority
          </label>
          <input
            type="text"
            placeholder="Mid-level, Senior, Director..."
            value={seniority}
            onChange={(e) => setSeniority(e.target.value)}
            className="block w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-medium text-slate-700">
            Work mode
          </label>
          <select
            value={workMode}
            onChange={(e) => setWorkMode(e.target.value)}
            className="block w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
          >
            <option value="">Select...</option>
            <option value="onsite">Onsite</option>
            <option value="hybrid">Hybrid</option>
            <option value="remote">Remote</option>
          </select>
        </div>
      </div>

      {/* Visibility + confidential */}
      <div className="space-y-1">
        <label className="block text-xs font-medium text-slate-700">
          Visibility
        </label>
        <select
          value={visibility}
          onChange={(e) =>
            setVisibility(e.target.value as "public" | "internal" | "confidential")
          }
          className="block w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
        >
          <option value="public">Public (careers page)</option>
          <option value="internal">Internal only</option>
          <option value="confidential">Confidential (no client branding)</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <input
          id="confidential"
          type="checkbox"
          checked={isConfidential}
          onChange={(e) => setIsConfidential(e.target.checked)}
          className="h-3 w-3 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
        />
        <label htmlFor="confidential" className="text-xs text-slate-700">
          Hide client name and logo (confidential search)
        </label>
      </div>

      {/* Short description */}
      <div className="space-y-1">
        <label className="block text-xs font-medium text-slate-700">
          Short description
        </label>
        <textarea
          rows={2}
          value={shortDescription}
          onChange={(e) => setShortDescription(e.target.value)}
          className="block w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
        />
      </div>

      {/* Full description */}
      <div className="space-y-1">
        <label className="block text-xs font-medium text-slate-700">
          Full description
        </label>
        <textarea
          rows={6}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="block w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
        />
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center rounded-md bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-60"
        >
          {submitting ? "Creating…" : "Create job"}
        </button>
      </div>
    </form>
  );
};

export default JobCreateForm;
