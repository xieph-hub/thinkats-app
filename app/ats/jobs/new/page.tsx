// app/ats/jobs/new/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Visibility = "public" | "internal" | "confidential";
type WorkMode = "remote" | "hybrid" | "onsite" | "flexible";
type EmploymentType =
  | "full_time"
  | "part_time"
  | "contract"
  | "temporary"
  | "internship";
type ExperienceLevel = "junior" | "mid" | "senior" | "lead" | "director";

type JobFormState = {
  title: string;
  department: string;
  location: string;
  shortDescription: string;
  description: string;
  employmentType: EmploymentType;
  experienceLevel: ExperienceLevel;
  workMode: WorkMode;
  visibility: Visibility;
  clientCompanyId: string; // "" = no client (internal/Resourcin)
  salaryMin: string;
  salaryMax: string;
  salaryCurrency: string;
  salaryVisible: boolean;
  tagsRaw: string;
  requiredSkills: string;
};

const defaultState: JobFormState = {
  title: "",
  department: "",
  location: "",
  shortDescription: "",
  description: "",
  employmentType: "full_time",
  experienceLevel: "mid",
  workMode: "onsite",
  visibility: "public",
  clientCompanyId: "",
  salaryMin: "",
  salaryMax: "",
  salaryCurrency: "NGN",
  salaryVisible: true,
  tagsRaw: "",
  requiredSkills: "",
};

// TODO: replace with real client_companies IDs once you have them wired.
const clientOptions: { value: string; label: string }[] = [
  { value: "", label: "No client (internal / Resourcin role)" },
  { value: "qlife_clinics", label: "QLife Clinics" },
  { value: "trips_africa", label: "Trips Africa (Trazitech Group)" },
];

export default function NewJobPage() {
  const router = useRouter();
  const [form, setForm] = useState<JobFormState>(defaultState);
  const [isSubmitting, setIsSubmitting] = useState<"draft" | "publish" | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  function updateField<K extends keyof JobFormState>(
    field: K,
    value: JobFormState[K]
  ) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(submitMode: "draft" | "publish") {
    setIsSubmitting(submitMode);
    setError(null);

    try {
      // Map to API body that route.ts expects
      const payload = {
        title: form.title.trim(),
        department: form.department.trim() || null,
        location: form.location.trim(),
        shortDescription: form.shortDescription.trim() || null,
        description: form.description.trim(),
        employmentType: form.employmentType,
        experienceLevel: form.experienceLevel,
        // We only use work_mode (route can also fall back to locationType)
        work_mode: form.workMode,
        // Visibility flags – route will derive internal_only & confidential
        visibility: form.visibility,
        // Client link
        client_company_id: form.clientCompanyId || null,
        // Compensation – send as strings, route parses numbers
        salaryMin: form.salaryMin.trim() || null,
        salaryMax: form.salaryMax.trim() || null,
        salaryCurrency: form.salaryCurrency.trim() || null,
        salaryVisible: form.salaryVisible,
        // Tagging & skills – route already splits tags_raw & requiredSkills
        tags_raw: form.tagsRaw.trim(),
        requiredSkills: form.requiredSkills.trim(),
        // Status intent
        submit_mode: submitMode, // "draft" | "publish"
      };

      const res = await fetch("/api/ats/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(
          text || `Failed to create job (status ${res.status.toString()})`
        );
      }

      const data = (await res.json()) as { jobId?: string; slug?: string | null };

      if (data?.jobId) {
        router.push(`/ats/jobs/${data.jobId}`);
      } else {
        router.push("/ats/jobs");
      }
    } catch (err: any) {
      console.error("Error creating job", err);
      setError(err.message ?? "Failed to create job. Please try again.");
    } finally {
      setIsSubmitting(null);
    }
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Publish a new role
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Create a mandate in ThinkATS for Resourcin and optionally publish it
          to the public job board.
        </p>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-6 rounded-xl border bg-white p-4 shadow-sm md:p-6">
        {/* Core details */}
        <section className="grid gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            Core details
          </h2>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-gray-900"
                value={form.title}
                onChange={(e) => updateField("title", e.target.value)}
                placeholder="Deputy Medical Director"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">
                Department / Function
              </label>
              <input
                className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-gray-900"
                value={form.department}
                onChange={(e) => updateField("department", e.target.value)}
                placeholder="Operations, Product, Finance, etc."
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">
                Location <span className="text-red-500">*</span>
              </label>
              <input
                className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-gray-900"
                value={form.location}
                onChange={(e) => updateField("location", e.target.value)}
                placeholder="Lagos, Nairobi, Remote – Africa, etc."
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Employment type</label>
              <select
                className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-gray-900"
                value={form.employmentType}
                onChange={(e) =>
                  updateField("employmentType", e.target.value as EmploymentType)
                }
              >
                <option value="full_time">Full time</option>
                <option value="part_time">Part time</option>
                <option value="contract">Contract</option>
                <option value="temporary">Temporary</option>
                <option value="internship">Internship</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Experience level</label>
              <select
                className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-gray-900"
                value={form.experienceLevel}
                onChange={(e) =>
                  updateField("experienceLevel", e.target.value as ExperienceLevel)
                }
              >
                <option value="junior">Junior</option>
                <option value="mid">Mid</option>
                <option value="senior">Senior</option>
                <option value="lead">Lead</option>
                <option value="director">Director / VP+</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Short summary</label>
            <input
              className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-gray-900"
              value={form.shortDescription}
              onChange={(e) => updateField("shortDescription", e.target.value)}
              placeholder="1–2 line description for job cards."
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">
              Full description <span className="text-red-500">*</span>
            </label>
            <textarea
              className="min-h-[150px] w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-gray-900"
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
              placeholder="Role context, responsibilities, requirements, reporting line, etc."
            />
          </div>
        </section>

        {/* Work mode & client */}
        <section className="grid gap-4 border-t pt-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            Work mode & client
          </h2>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Work mode</label>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {([
                  { value: "remote", label: "Remote" },
                  { value: "hybrid", label: "Hybrid" },
                  { value: "onsite", label: "On-site" },
                  { value: "flexible", label: "Flexible" },
                ] as const).map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() =>
                      updateField("workMode", option.value as WorkMode)
                    }
                    className={[
                      "rounded-md border px-3 py-2 text-left",
                      form.workMode === option.value
                        ? "border-gray-900 bg-gray-900 text-white"
                        : "border-gray-200 bg-gray-50 text-gray-700",
                    ].join(" ")}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500">
                This is saved as <span className="font-mono">work_mode</span>{" "}
                and appears on the public job card.
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">
                Client company (optional)
              </label>
              <select
                className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-gray-900"
                value={form.clientCompanyId}
                onChange={(e) => updateField("clientCompanyId", e.target.value)}
              >
                {clientOptions.map((client) => (
                  <option key={client.value} value={client.value}>
                    {client.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500">
                Saved as{" "}
                <span className="font-mono">client_company_id</span>. When
                visibility is public, you can show the client&apos;s name/logo
                on the job.
              </p>
            </div>
          </div>
        </section>

        {/* Visibility & confidentiality */}
        <section className="grid gap-4 border-t pt-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            Visibility & confidentiality
          </h2>

          <div className="grid gap-4 md:grid-cols-3">
            <button
              type="button"
              onClick={() => updateField("visibility", "public")}
              className={[
                "flex flex-col items-start gap-1 rounded-md border px-3 py-2 text-left text-sm",
                form.visibility === "public"
                  ? "border-gray-900 bg-gray-900 text-white"
                  : "border-gray-200 bg-gray-50 text-gray-700",
              ].join(" ")}
            >
              <span className="font-medium">Public</span>
              <span className="text-xs opacity-80">
                Listed on Resourcin job board with client visible (if set).
              </span>
            </button>

            <button
              type="button"
              onClick={() => updateField("visibility", "confidential")}
              className={[
                "flex flex-col items-start gap-1 rounded-md border px-3 py-2 text-left text-sm",
                form.visibility === "confidential"
                  ? "border-gray-900 bg-gray-900 text-white"
                  : "border-gray-200 bg-gray-50 text-gray-700",
              ].join(" ")}
            >
              <span className="font-medium">Confidential</span>
              <span className="text-xs opacity-80">
                Public but shown as &quot;Confidential search – via
                Resourcin&quot;; client hidden.
              </span>
            </button>

            <button
              type="button"
              onClick={() => updateField("visibility", "internal")}
              className={[
                "flex flex-col items-start gap-1 rounded-md border px-3 py-2 text-left text-sm",
                form.visibility === "internal"
                  ? "border-gray-900 bg-gray-900 text-white"
                  : "border-gray-200 bg-gray-50 text-gray-700",
              ].join(" ")}
            >
              <span className="font-medium">Internal</span>
              <span className="text-xs opacity-80">
                ATS-only mandate. Not listed on the public board.
              </span>
            </button>
          </div>
        </section>

        {/* Compensation */}
        <section className="grid gap-4 border-t pt-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            Compensation
          </h2>

          <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr]">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Salary from</label>
              <input
                type="number"
                min={0}
                className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-gray-900"
                value={form.salaryMin}
                onChange={(e) => updateField("salaryMin", e.target.value)}
                placeholder="e.g. 12000000"
              />
            </div>

            <div className="flex flex-col items-center justify-center pt-6 text-xs text-gray-400">
              to
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Salary to</label>
              <input
                type="number"
                min={0}
                className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-gray-900"
                value={form.salaryMax}
                onChange={(e) => updateField("salaryMax", e.target.value)}
                placeholder="e.g. 18000000"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Currency</label>
              <select
                className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-gray-900"
                value={form.salaryCurrency}
                onChange={(e) =>
                  updateField("salaryCurrency", e.target.value)
                }
              >
                <option value="NGN">NGN – Nigerian Naira</option>
                <option value="USD">USD – US Dollar</option>
                <option value="KES">KES – Kenyan Shilling</option>
                <option value="GHS">GHS – Ghanaian Cedi</option>
                <option value="ZAR">ZAR – South African Rand</option>
              </select>
            </div>

            <label className="mt-6 flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300"
                checked={form.salaryVisible}
                onChange={(e) =>
                  updateField("salaryVisible", e.target.checked)
                }
              />
              <span>
                Show salary range on the public job (if role is visible
                externally).
              </span>
            </label>
          </div>
        </section>

        {/* Tags & skills */}
        <section className="grid gap-4 border-t pt-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            Tags & skills
          </h2>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Tags</label>
            <input
              className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-gray-900"
              value={form.tagsRaw}
              onChange={(e) => updateField("tagsRaw", e.target.value)}
              placeholder="e.g. healthcare, hospital, executive, Lagos"
            />
            <p className="text-xs text-gray-500">
              Comma-separated. Sent as{" "}
              <span className="font-mono">tags_raw</span>; the API converts to{" "}
              <span className="font-mono">tags[]</span>.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Required skills</label>
            <input
              className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-gray-900"
              value={form.requiredSkills}
              onChange={(e) =>
                updateField("requiredSkills", e.target.value)
              }
              placeholder="e.g. MBBS, leadership, hospital operations, stakeholder management"
            />
            <p className="text-xs text-gray-500">
              Comma-separated. Sent as{" "}
              <span className="font-mono">requiredSkills</span>; the API stores
              a string array.
            </p>
          </div>
        </section>

        {/* Actions */}
        <section className="flex flex-col gap-3 border-t pt-4 md:flex-row md:items-center md:justify-between">
          <div className="text-xs text-gray-500">
            <div>
              <span className="font-medium text-gray-700">Save as draft</span>{" "}
              sends <span className="font-mono">submit_mode = "draft"</span> and
              results in <span className="font-mono">status = "draft"</span>.
            </div>
            <div>
              <span className="font-medium text-gray-700">Publish now</span>{" "}
              sends <span className="font-mono">submit_mode = "publish"</span>{" "}
              and route.ts sets{" "}
              <span className="font-mono">status = "open"</span>.
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleSubmit("draft")}
              disabled={isSubmitting !== null}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting === "draft" ? "Saving..." : "Save as draft"}
            </button>

            <button
              type="button"
              onClick={() => handleSubmit("publish")}
              disabled={isSubmitting !== null}
              className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting === "publish" ? "Publishing..." : "Publish now"}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
