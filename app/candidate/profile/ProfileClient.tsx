// app/candidate/profile/ProfileClient.tsx
"use client";

import { FormEvent, useState } from "react";

type CandidateProfile = {
  fullName: string;
  email: string;
  phone?: string | null;
  location?: string | null;
  linkedinUrl?: string | null;
  yearsOfExperience?: number | null;
  currentRole?: string | null;
  currentCompany?: string | null;
  primaryFunction?: string | null;
  seniority?: string | null;
  skills: string[];
};

type Status = "idle" | "saving" | "success" | "error";

export default function ProfileClient({
  initial,
}: {
  initial: CandidateProfile;
}) {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("saving");
    setMessage(null);

    const formData = new FormData(e.currentTarget);

    const payload = {
      fullName: String(formData.get("fullName") || ""),
      phone: String(formData.get("phone") || ""),
      location: String(formData.get("location") || ""),
      linkedinUrl: String(formData.get("linkedinUrl") || ""),
      yearsOfExperience: formData.get("yearsOfExperience"),
      currentRole: String(formData.get("currentRole") || ""),
      currentCompany: String(formData.get("currentCompany") || ""),
      primaryFunction: String(formData.get("primaryFunction") || ""),
      seniority: String(formData.get("seniority") || ""),
      skills: String(formData.get("skills") || ""),
    };

    try {
      const res = await fetch("/api/candidate/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Could not save profile.");
      }

      setStatus("success");
      setMessage("Profile updated.");
    } catch (err: any) {
      console.error(err);
      setStatus("error");
      setMessage(err.message || "Something went wrong. Please try again.");
    }
  }

  const skillsString = initial.skills?.join(", ") ?? "";

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#306B34]">
            Candidate portal
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900 sm:text-3xl">
            Your profile
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            This is what informs how we pitch you to employers. Clean, credible
            detail beats fluff.
          </p>
        </header>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-slate-700">
                Full name
              </label>
              <input
                name="fullName"
                type="text"
                defaultValue={initial.fullName}
                required
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#172965]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700">
                Email (read-only)
              </label>
              <input
                type="email"
                value={initial.email}
                readOnly
                className="mt-1 w-full rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700">
                Phone / WhatsApp
              </label>
              <input
                name="phone"
                type="tel"
                defaultValue={initial.phone ?? ""}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#172965]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700">
                Location
              </label>
              <input
                name="location"
                type="text"
                defaultValue={initial.location ?? ""}
                placeholder="Lagos, Nairobi, Remote Africa, etc."
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#172965]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700">
                LinkedIn URL
              </label>
              <input
                name="linkedinUrl"
                type="url"
                defaultValue={initial.linkedinUrl ?? ""}
                placeholder="https://www.linkedin.com/in/…"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#172965]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700">
                Years of experience
              </label>
              <input
                name="yearsOfExperience"
                type="number"
                min={0}
                defaultValue={initial.yearsOfExperience ?? ""}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#172965]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700">
                Current role
              </label>
              <input
                name="currentRole"
                type="text"
                defaultValue={initial.currentRole ?? ""}
                placeholder="e.g. Senior Product Manager"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#172965]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700">
                Current company
              </label>
              <input
                name="currentCompany"
                type="text"
                defaultValue={initial.currentCompany ?? ""}
                placeholder="e.g. FintechCo"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#172965]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700">
                Primary function
              </label>
              <input
                name="primaryFunction"
                type="text"
                defaultValue={initial.primaryFunction ?? ""}
                placeholder="Product, Engineering, Sales, People, etc."
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#172965]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700">
                Seniority
              </label>
              <input
                name="seniority"
                type="text"
                defaultValue={initial.seniority ?? ""}
                placeholder="Mid, Senior, Lead, Director, etc."
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#172965]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700">
              Key skills
            </label>
            <textarea
              name="skills"
              rows={3}
              defaultValue={skillsString}
              placeholder="Comma-separated: e.g. Product discovery, GTM, Stakeholder management"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#172965]"
            />
            <p className="mt-1 text-[11px] text-slate-500">
              We use this to align you with roles faster. Think tools,
              domains and strengths.
            </p>
          </div>

          <div className="flex items-center justify-between gap-3 pt-2">
            <button
              type="submit"
              disabled={status === "saving"}
              className="inline-flex items-center rounded-full bg-[#172965] px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#101b47] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {status === "saving" ? "Saving…" : "Save profile"}
            </button>

            {message && (
              <p
                className={`text-xs ${
                  status === "success"
                    ? "text-emerald-600"
                    : "text-amber-700"
                }`}
              >
                {message}
              </p>
            )}
          </div>
        </form>
      </main>
    </div>
  );
}
