// app/talent-network/page.tsx
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Join Talent Network | Resourcin",
  description:
    "Join the Resourcin talent network to be considered for current and upcoming roles across Product, Engineering, People, Sales and Operations.",
};

interface PageProps {
  searchParams?: { [key: string]: string | string[] | undefined };
}

const JOB_LABELS: Record<string, string> = {
  "senior-product-manager-fintech": "Senior Product Manager – Fintech Platform",
  "backend-engineer-payments": "Backend Engineer – Payments & Wallets",
  "people-ops-lead-multi-country": "People Operations Lead – Multi-country",
  "enterprise-sales-manager-b2b-saas":
    "Enterprise Sales Manager – B2B SaaS",
  "senior-data-analyst-product-ops":
    "Senior Data Analyst – Product & Operations",
  "customer-success-lead-enterprise":
    "Customer Success Lead – Enterprise Accounts",
};

export default function TalentNetworkPage({ searchParams }: PageProps) {
  const jobSlugRaw = searchParams?.job;
  const jobSlug =
    typeof jobSlugRaw === "string" ? jobSlugRaw : undefined;
  const jobLabel = jobSlug ? JOB_LABELS[jobSlug] : undefined;

  return (
    <div className="bg-slate-50 min-h-screen">
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Hero */}
        <section className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
            <span className="h-2 w-2 rounded-full bg-[#64C247]" />
            Talent Network
          </div>

          <div className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-xl">
              <h1 className="text-3xl font-semibold tracking-tight text-[#172965] sm:text-4xl">
                Share your profile once. We&apos;ll plug you into the right
                searches.
              </h1>
              <p className="mt-3 text-sm sm:text-base text-slate-600">
                This isn&apos;t a job board. It&apos;s a short, structured way
                for us to understand your experience, what you want next, and
                where you&apos;re strongest — so when a relevant search comes
                up, we can reach out with context, not guesswork.
              </p>

              <div className="mt-5 grid gap-3 text-xs sm:text-sm sm:grid-cols-2">
                <div className="rounded-xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    What you can expect
                  </p>
                  <ul className="mt-2 space-y-1 text-slate-600">
                    <li>• Human screening, not keyword robots.</li>
                    <li>• If we reach out, it&apos;s for a real brief.</li>
                    <li>• Honest feedback where we can give it.</li>
                  </ul>
                </div>
                <div className="rounded-xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Focus areas
                  </p>
                  <ul className="mt-2 space-y-1 text-slate-600">
                    <li>• Product, Engineering, Data.</li>
                    <li>• People, Ops, Finance, Strategy.</li>
                    <li>• Sales, Growth, Customer Success.</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-col items-start gap-2 text-xs sm:mt-0 sm:text-sm lg:items-end">
              {jobLabel && (
                <div className="rounded-xl bg-white px-4 py-3 text-left shadow-sm ring-1 ring-[#64C247]/40">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#306B34]">
                    You&apos;re responding to
                  </p>
                  <p className="mt-1 text-sm font-medium text-[#172965]">
                    {jobLabel}
                  </p>
                  <p className="mt-1 text-xs text-slate-600">
                    We&apos;ll use this to tag your profile internally.
                  </p>
                </div>
              )}
              <p className="mt-2 text-xs text-slate-500">
                Already in process for a role? You can still update your
                details here.
              </p>
            </div>
          </div>
        </section>

        {/* Form */}
        <section
          aria-label="Talent network form"
          className="rounded-2xl bg-white px-5 py-6 shadow-sm ring-1 ring-slate-200 sm:px-7"
        >
          <form
            method="POST"
            action="/api/talent-network" // You can change this to your actual endpoint later.
            className="space-y-6"
          >
            {/* Hidden job slug if coming from /jobs */}
            {jobSlug && (
              <input type="hidden" name="jobSlug" value={jobSlug} />
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label
                  htmlFor="fullName"
                  className="text-xs font-medium text-slate-700"
                >
                  Full name
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required
                  autoComplete="name"
                  className="block w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none ring-offset-1 focus:border-[#172965] focus:bg-white focus:ring-2 focus:ring-[#172965]"
                />
              </div>
              <div className="space-y-1.5">
                <label
                  htmlFor="email"
                  className="text-xs font-medium text-slate-700"
                >
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  className="block w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none ring-offset-1 focus:border-[#172965] focus:bg-white focus:ring-2 focus:ring-[#172965]"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label
                  htmlFor="phone"
                  className="text-xs font-medium text-slate-700"
                >
                  Phone / WhatsApp (with country code)
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  placeholder="+234..."
                  className="block w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none ring-offset-1 focus:border-[#172965] focus:bg-white focus:ring-2 focus:ring-[#172965]"
                />
              </div>
              <div className="space-y-1.5">
                <label
                  htmlFor="location"
                  className="text-xs font-medium text-slate-700"
                >
                  Current location (City, Country)
                </label>
                <input
                  id="location"
                  name="location"
                  type="text"
                  required
                  placeholder="Lagos, Nigeria"
                  className="block w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none ring-offset-1 focus:border-[#172965] focus:bg-white focus:ring-2 focus:ring-[#172965]"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label
                  htmlFor="linkedin"
                  className="text-xs font-medium text-slate-700"
                >
                  LinkedIn profile
                </label>
                <input
                  id="linkedin"
                  name="linkedin"
                  type="url"
                  placeholder="https://www.linkedin.com/in/..."
                  className="block w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none ring-offset-1 focus:border-[#172965] focus:bg-white focus:ring-2 focus:ring-[#172965]"
                />
              </div>
              <div className="space-y-1.5">
                <label
                  htmlFor="portfolio"
                  className="text-xs font-medium text-slate-700"
                >
                  Portfolio / GitHub / Personal site (optional)
                </label>
                <input
                  id="portfolio"
                  name="portfolio"
                  type="url"
                  placeholder="https://..."
                  className="block w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none ring-offset-1 focus:border-[#172965] focus:bg-white focus:ring-2 focus:ring-[#172965]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="cvUrl"
                className="text-xs font-medium text-slate-700"
              >
                CV / Resume link (Google Drive, Dropbox, etc.)
              </label>
              <input
                id="cvUrl"
                name="cvUrl"
                type="url"
                required
                placeholder="Share a view-only link to your CV"
                className="block w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none ring-offset-1 focus:border-[#172965] focus:bg-white focus:ring-2 focus:ring-[#172965]"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label
                  htmlFor="primaryFunction"
                  className="text-xs font-medium text-slate-700"
                >
                  Primary function
                </label>
                <select
                  id="primaryFunction"
                  name="primaryFunction"
                  required
                  className="block w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none ring-offset-1 focus:border-[#172965] focus:bg-white focus:ring-2 focus:ring-[#172965]"
                >
                  <option value="">Select one</option>
                  <option value="product">Product Management</option>
                  <option value="design">Design / UX</option>
                  <option value="engineering">Engineering</option>
                  <option value="data">Data / Analytics</option>
                  <option value="people">People / HR / Talent</option>
                  <option value="ops">Operations / Program Management</option>
                  <option value="sales">Sales / Business Development</option>
                  <option value="cs">Customer Success / Account Management</option>
                  <option value="finance">Finance / Strategy</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="experienceLevel"
                  className="text-xs font-medium text-slate-700"
                >
                  Experience level
                </label>
                <select
                  id="experienceLevel"
                  name="experienceLevel"
                  required
                  className="block w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none ring-offset-1 focus:border-[#172965] focus:bg-white focus:ring-2 focus:ring-[#172965]"
                >
                  <option value="">Select one</option>
                  <option value="junior">0–3 years (Junior)</option>
                  <option value="mid">3–7 years (Mid-level)</option>
                  <option value="senior">7–12 years (Senior)</option>
                  <option value="lead">12+ years (Lead / Exec)</option>
                </select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label
                  htmlFor="currentCompany"
                  className="text-xs font-medium text-slate-700"
                >
                  Current / most recent company
                </label>
                <input
                  id="currentCompany"
                  name="currentCompany"
                  type="text"
                  className="block w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none ring-offset-1 focus:border-[#172965] focus:bg-white focus:ring-2 focus:ring-[#172965]"
                />
              </div>
              <div className="space-y-1.5">
                <label
                  htmlFor="compensation"
                  className="text-xs font-medium text-slate-700"
                >
                  Current / last total compensation (currency + per month / year)
                </label>
                <input
                  id="compensation"
                  name="compensation"
                  type="text"
                  placeholder="e.g. ₦900k / month, $60k / year"
                  className="block w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none ring-offset-1 focus:border-[#172965] focus:bg-white focus:ring-2 focus:ring-[#172965]"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label
                  htmlFor="targetRole"
                  className="text-xs font-medium text-slate-700"
                >
                  Role you&apos;re most interested in next
                </label>
                <input
                  id="targetRole"
                  name="targetRole"
                  type="text"
                  defaultValue={jobLabel ?? ""}
                  placeholder="e.g. Senior Product Manager in fintech"
                  className="block w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none ring-offset-1 focus:border-[#172965] focus:bg-white focus:ring-2 focus:ring-[#172965]"
                />
              </div>
              <div className="space-y-1.5">
                <label
                  htmlFor="workPreference"
                  className="text-xs font-medium text-slate-700"
                >
                  Work preference
                </label>
                <select
                  id="workPreference"
                  name="workPreference"
                  required
                  className="block w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none ring-offset-1 focus:border-[#172965] focus:bg-white focus:ring-2 focus:ring-[#172965]"
                >
                  <option value="">Select one</option>
                  <option value="remote">Remote</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="onsite">On-site</option>
                  <option value="flexible">Flexible / open</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="summary"
                className="text-xs font-medium text-slate-700"
              >
                In 4–6 bullet points, tell us where you create the most value.
              </label>
              <textarea
                id="summary"
                name="summary"
                rows={5}
                placeholder={`• Built...\n• Improved...\n• Led...\n• Delivered...`}
                className="block w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none ring-offset-1 focus:border-[#172965] focus:bg-white focus:ring-2 focus:ring-[#172965]"
              />
              <p className="text-[0.7rem] text-slate-500">
                Think of this as the “real” version of your CV headline — what
                you&apos;ve actually done, not just your title.
              </p>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="notes"
                className="text-xs font-medium text-slate-700"
              >
                Anything else we should know?
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                placeholder="Context on notice period, relocation, visa status, etc."
                className="block w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none ring-offset-1 focus:border-[#172965] focus:bg-white focus:ring-2 focus:ring-[#172965]"
              />
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[0.7rem] sm:text-xs text-slate-500">
                By submitting, you agree that we can store your details and
                reach out when we see a strong match. We won&apos;t spam you or
                sell your data.
              </p>
              <div className="flex items-center gap-2">
                <Link
                  href="/jobs"
                  className="text-[0.7rem] sm:text-xs font-medium text-[#172965] underline-offset-2 hover:underline"
                >
                  Back to jobs
                </Link>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-lg bg-[#172965] px-4 py-2 text-xs sm:text-sm font-medium text-white shadow-sm hover:bg-[#0f1c46] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#172965]"
                >
                  Submit profile
                  <span className="ml-2 text-[0.7rem]" aria-hidden="true">
                    →
                  </span>
                </button>
              </div>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}
