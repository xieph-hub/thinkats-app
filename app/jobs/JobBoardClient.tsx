"use client";

import { useState } from "react";
import Link from "next/link";
import { SITE_URL } from "@/lib/site";

// -----------------------------------------------------------------------------
// Types local to the job board UI
// -----------------------------------------------------------------------------

export type JobBoardJob = {
  slug: string;
  title: string;
  employerInitials: string;
  employerName: string;
  department: string;
  location: string;
  workType: string;
  type: string;
  seniority: string;
  salaryRange: string | null;
  highlight: string | null;
  tags: string[];
  postedAt: string;
};

// -----------------------------------------------------------------------------
// Board config (still single-tenant for now)
// -----------------------------------------------------------------------------

const JOB_BOARD_CONFIG = {
  boardName: "Resourcin Talent Network",
  primaryColor: "#172965",
  accentColor: "#64C247",
  background: "#F1F5F9",
  employerCtaLabel: "Use this board for your roles",
  poweredByLabel: "Powered by Resourcin",
};

// UTMs for static CTAs
const TALENT_NETWORK_HERO_URL =
  "/talent-network?utm_source=resourcin_job_board&utm_medium=hero_cta&utm_campaign=talent_network";

const TALENT_NETWORK_BOTTOM_URL =
  "/talent-network?utm_source=resourcin_job_board&utm_medium=bottom_cta&utm_campaign=talent_network";

const EMPLOYER_CTA_URL =
  "/request-talent?utm_source=resourcin_job_board&utm_medium=employer_cta&utm_campaign=request_talent";

// -----------------------------------------------------------------------------
// Icons
// -----------------------------------------------------------------------------

function LocationIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      {...props}
      className={`h-3.5 w-3.5 text-red-500 ${props.className ?? ""}`}
    >
      <path
        d="M12 2.75a6.25 6.25 0 0 0-6.25 6.25c0 4.39 4.76 9.19 5.96 10.37a.9.9 0 0 0 1.26 0c1.2-1.18 5.98-5.98 5.98-10.37A6.25 6.25 0 0 0 12 2.75Zm0 9.25a3 3 0 1 1 0-6.001 3 3 0 0 1 0 6Z"
        fill="currentColor"
      />
    </svg>
  );
}

function BriefcaseIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      {...props}
      className={`h-3.5 w-3.5 text-amber-800 ${props.className ?? ""}`}
    >
      <path
        d="M9 4.5A1.5 1.5 0 0 1 10.5 3h3A1.5 1.5 0 0 1 15 4.5V6h3.25A1.75 1.75 0 0 1 20 7.75v9.5A1.75 1.75 0 0 1 18.25 19H5.75A1.75 1.75 0 0 1 4 17.25v-9.5A1.75 1.75 0 0 1 5.75 6H9V4.5Zm1.5.25v1.25h3V4.75h-3Z"
        fill="currentColor"
      />
    </svg>
  );
}

function SparklesIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      {...props}
      className={`h-3.5 w-3.5 text-yellow-400 ${props.className ?? ""}`}
    >
      <path
        d="M12 3.25 13.4 7l3.6 1.4L13.4 9.8 12 13.5 10.6 9.8 7 8.4 10.6 7 12 3.25Zm6.5 7.25.75 2 2 0.75-2 .75-.75 2-.75-2-2-.75 2-.75.75-2Zm-13 4.5.9 2.4 2.35.9-2.35.9-.9 2.35-.9-2.35L3.25 19l2.25-.9.9-2.4Z"
        fill="currentColor"
      />
    </svg>
  );
}

function CurrencyIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      {...props}
      className={`h-3.5 w-3.5 text-emerald-500 ${props.className ?? ""}`}
    >
      <path
        d="M11 4.75h2a.75.75 0 0 1 0 1.5h-1.25v2h.5a4.25 4.25 0 1 1 0 8.5H11a.75.75 0 0 1 0-1.5h1.25v-2h-.5a4.25 4.25 0 1 1 0-8.5Zm.75 4v6.5h1a2.75 2.75 0 0 0 0-5.5h-1Zm-1.5 0h-1a2.75 2.75 0 0 0 0 5.5h1V8.75Z"
        fill="currentColor"
      />
    </svg>
  );
}

function ClockIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      {...props}
      className={`h-3.5 w-3.5 text-sky-500 ${props.className ?? ""}`}
    >
      <path
        d="M12 3.25a8.75 8.75 0 1 0 0 17.5 8.75 8.75 0 0 0 0-17.5Zm-.75 4.5a.75.75 0 0 1 1.5 0V12l2.22 2.22a.75.75 0 1 1-1.06 1.06l-2.5-2.5A.75.75 0 0 1 11.25 12V7.75Z"
        fill="currentColor"
      />
    </svg>
  );
}

function LinkedInIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      {...props}
      className={`h-3.5 w-3.5 text-[#0A66C2] ${props.className ?? ""}`}
    >
      <path
        d="M5.16 4.5a1.91 1.91 0 1 1 0 3.82 1.91 1.91 0 0 1 0-3.82ZM4 9h2.32v10.5H4V9Zm5.18 0H11.4v1.46h.03c.31-.59 1.1-1.21 2.27-1.21 2.43 0 2.88 1.6 2.88 3.68v6.57h-2.32v-5.83c0-1.39-.03-3.18-1.94-3.18-1.94 0-2.24 1.51-2.24 3.07v5.94H9.18V9Z"
        fill="currentColor"
      />
    </svg>
  );
}

function XIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      {...props}
      className={`h-3.5 w-3.5 text-slate-900 ${props.className ?? ""}`}
    >
      <path
        d="M5.25 4h3.02l3.02 4.33L14.83 4h3.92l-5 6.72L19 20h-3.02l-3.26-4.71L9 20H5.08l5.08-6.9L5.25 4Z"
        fill="currentColor"
      />
    </svg>
  );
}

function WhatsAppIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      {...props}
      className={`h-3.5 w-3.5 text-[#25D366] ${props.className ?? ""}`}
    >
      <path
        d="M12.04 3.25A8.76 8.76 0 0 0 3.25 12a8.7 8.7 0 0 0 1.26 4.52L3 21l4.61-1.47A8.76 8.76 0 1 0 12.04 3.25Zm0 1.5a7.25 7.25 0 0 1 6.16 11.11l-.18.28a7.24 7.24 0 0 1-9.19 2.37l-.2-.1-2.7.86.9-2.61-.13-.21A7.24 7.24 0 0 1 12.04 4.75Zm-3.1 3.3c-.17 0-.44.05-.68.34-.24.3-.9.88-.9 2.13 0 1.24.92 2.45 1.05 2.62.13.17 1.8 2.87 4.46 3.9 2.2.87 2.65.79 3.13.74.48-.04 1.54-.63 1.76-1.23.22-.6.22-1.12.16-1.23-.06-.11-.24-.18-.5-.32-.26-.13-1.54-.76-1.78-.84-.24-.09-.41-.13-.6.13-.19.25-.69.84-.85 1.02-.16.18-.32.2-.59.07-.26-.13-1.11-.41-2.11-1.31-.78-.7-1.3-1.56-1.46-1.82-.16-.25-.02-.4.12-.54.13-.13.3-.34.45-.51.15-.17.2-.3.3-.5.1-.2.05-.37 0-.51-.06-.13-.53-1.35-.73-1.84-.18-.45-.37-.46-.54-.47Z"
        fill="currentColor"
      />
    </svg>
  );
}

function InfoPill({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-1 text-[0.7rem] font-medium text-slate-600 ring-1 ring-slate-200">
      <span className="flex items-center justify-center">{icon}</span>
      <span>{label}</span>
    </span>
  );
}

// -----------------------------------------------------------------------------
// Filter UI
// -----------------------------------------------------------------------------

type FilterPillProps = {
  label: string;
  active: boolean;
  onClick: () => void;
};

function FilterPill({ label, active, onClick }: FilterPillProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "inline-flex items-center rounded-full px-3 py-1 text-[0.7rem] font-medium transition",
        active
          ? "bg-[#172965] text-white shadow-sm"
          : "bg-slate-50 text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

type FilterGroupProps = {
  label: string;
  options: string[];
  selected: string | null;
  onSelect: (value: string | null) => void;
};

function FilterGroup({
  label,
  options,
  selected,
  onSelect,
}: FilterGroupProps) {
  if (!options.length) return null;

  return (
    <div className="space-y-2">
      <p className="text-[0.7rem] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <div className="flex flex-wrap gap-1.5">
        <FilterPill
          label="All"
          active={selected === null}
          onClick={() => onSelect(null)}
        />
        {options.map((opt) => (
          <FilterPill
            key={opt}
            label={opt}
            active={selected === opt}
            onClick={() => onSelect(selected === opt ? null : opt)}
          />
        ))}
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Main client component
// -----------------------------------------------------------------------------

type JobBoardClientProps = {
  jobs: JobBoardJob[];
};

export default function JobBoardClient({ jobs }: JobBoardClientProps) {
  const brand = JOB_BOARD_CONFIG;

  const locations = Array.from(new Set(jobs.map((j) => j.location))).sort();
  const functions = Array.from(new Set(jobs.map((j) => j.department))).sort();
  const seniorities = Array.from(new Set(jobs.map((j) => j.seniority))).sort();

  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [selectedFunction, setSelectedFunction] = useState<string | null>(null);
  const [selectedSeniority, setSelectedSeniority] =
    useState<string | null>(null);

  const clearFilters = () => {
    setSelectedLocation(null);
    setSelectedFunction(null);
    setSelectedSeniority(null);
  };

  const filteredJobs = jobs.filter((job) => {
    const matchLocation =
      !selectedLocation || job.location === selectedLocation;
    const matchFunction =
      !selectedFunction || job.department === selectedFunction;
    const matchSeniority =
      !selectedSeniority || job.seniority === selectedSeniority;

    return matchLocation && matchFunction && matchSeniority;
  });

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: brand.background }}
    >
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Board header */}
        <section className="mb-8">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: brand.accentColor }}
              />
              For Candidates
            </div>

            <div className="flex items-center gap-2 text-[0.7rem] text-slate-500 sm:text-xs">
              <span className="hidden sm:inline">Job board:</span>
              <span className="font-medium text-slate-700">
                {brand.boardName}
              </span>
              <span className="text-slate-400">·</span>
              <span>{brand.poweredByLabel}</span>
            </div>
          </div>

          <div
            className="rounded-2xl px-5 py-6 text-white shadow-sm sm:px-7 sm:py-8"
            style={{
              backgroundImage:
                "linear-gradient(120deg, #172965, #172965 55%, #203b99)",
            }}
          >
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-xl">
                <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                  Roles from teams that actually ship work.
                </h1>
                <p className="mt-3 text-sm text-slate-100/90 sm:text-base">
                  This board hosts searches across product, engineering, data,
                  people, sales and operations. In a white-label setup, the same
                  layout becomes a branded careers page for a single employer.
                </p>
              </div>

              <div className="flex flex-col items-start gap-3 text-xs lg:items-end">
                <div className="rounded-xl bg-white/10 px-4 py-3 text-slate-50 ring-1 ring-white/15">
                  <p className="text-[0.7rem] font-semibold uppercase tracking-wide text-slate-100">
                    How we work with candidates
                  </p>
                  <p className="mt-1 text-[0.75rem]">
                    No spam. Clear briefs, honest feedback, and roles that make
                    sense for your experience, not just your keywords.
                  </p>
                </div>
                <Link
                  href={TALENT_NETWORK_HERO_URL}
                  className="inline-flex items-center justify-center rounded-lg px-4 py-2 text-xs font-semibold text-[#0b1c3d] shadow-sm hover:brightness-105"
                  style={{ backgroundColor: brand.accentColor }}
                >
                  Join the talent network
                  <span className="ml-2 text-[0.7rem]" aria-hidden="true">
                    →
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Summary row */}
        <section className="mb-6">
          <div className="grid gap-3 text-xs sm:grid-cols-3 sm:text-sm">
            <div className="rounded-xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200">
              <p className="text-[0.7rem] font-semibold uppercase tracking-wide text-slate-500">
                Functions
              </p>
              <p className="mt-1 text-slate-700">
                Product, Engineering, Data, People, Ops, Sales & Customer
                Success.
              </p>
            </div>
            <div className="rounded-xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200">
              <p className="text-[0.7rem] font-semibold uppercase tracking-wide text-slate-500">
                Markets
              </p>
              <p className="mt-1 text-slate-700">
                Nigeria, Kenya and remote-friendly African & global teams.
              </p>
            </div>
            <div className="rounded-xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200">
              <p className="text-[0.7rem] font-semibold uppercase tracking-wide text-slate-500">
                Don&apos;t see your exact role?
              </p>
              <p className="mt-1 text-slate-700">
                Share your profile once. We match you to live and upcoming
                briefs.
              </p>
            </div>
          </div>
        </section>

        {/* Filter bar */}
        <section className="mb-6 rounded-2xl bg-white px-4 py-4 shadow-sm ring-1 ring-slate-200 sm:px-5 sm:py-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Filter roles
              </p>
              <p className="mt-1 text-xs text-slate-600 sm:text-sm">
                Tap to filter by location, function or seniority. Tap again to
                reset a filter.
              </p>
            </div>
            <button
              type="button"
              onClick={clearFilters}
              className="text-[0.7rem] font-medium text-slate-600 underline-offset-2 hover:underline sm:text-xs"
            >
              Clear all
            </button>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <FilterGroup
              label="Location"
              options={locations}
              selected={selectedLocation}
              onSelect={setSelectedLocation}
            />
            <FilterGroup
              label="Function"
              options={functions}
              selected={selectedFunction}
              onSelect={setSelectedFunction}
            />
            <FilterGroup
              label="Seniority"
              options={seniorities}
              selected={selectedSeniority}
              onSelect={setSelectedSeniority}
            />
          </div>
        </section>

        {/* Job cards */}
        <section aria-label="Open roles" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-[#172965] sm:text-lg">
              Representative searches & open roles
            </h2>
            <p className="text-[0.7rem] text-slate-500 sm:text-xs">
              Titles may be anonymised; full details are shared at screening.
            </p>
          </div>

          {filteredJobs.length === 0 ? (
            <div className="rounded-2xl bg-white px-5 py-6 text-center text-sm text-slate-600 shadow-sm ring-1 ring-slate-200">
              <p>No roles match these filters right now.</p>
              <button
                type="button"
                onClick={clearFilters}
                className="mt-3 inline-flex items-center justify-center rounded-lg bg-[#172965] px-3.5 py-1.5 text-xs font-medium text-white hover:bg-[#111c4c]"
              >
                Reset filters
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredJobs.map((job) => {
                const jobSlug = encodeURIComponent(job.slug);
                const jobDetailPath = `/jobs/${job.slug}`;
                const utmBase = `utm_source=resourcin_job_board&utm_campaign=job_${jobSlug}`;

                const detailFromListUrl = `${jobDetailPath}?${utmBase}&utm_medium=job_list&utm_content=card_cta`;

                const linkedInLandingUrl = `${SITE_URL}${jobDetailPath}?${utmBase}&utm_medium=social&utm_content=linkedin`;
                const xLandingUrl = `${SITE_URL}${jobDetailPath}?${utmBase}&utm_medium=social&utm_content=x`;
                const whatsAppLandingUrl = `${SITE_URL}${jobDetailPath}?${utmBase}&utm_medium=social&utm_content=whatsapp`;

                const encodedLinkedInLanding = encodeURIComponent(
                  linkedInLandingUrl
                );
                const encodedXLanding = encodeURIComponent(xLandingUrl);
                const shareText = encodeURIComponent(
                  `${job.title} – via Resourcin`
                );

                const linkedInShareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedLinkedInLanding}`;
                const xShareUrl = `https://twitter.com/intent/tweet?url=${encodedXLanding}&text=${shareText}`;
                const whatsAppMessage = encodeURIComponent(
                  `${job.title} – via Resourcin\n${whatsAppLandingUrl}`
                );
                const whatsAppShareUrl = `https://wa.me/?text=${whatsAppMessage}`;

                return (
                  <article
                    key={job.slug}
                    className="relative overflow-hidden rounded-2xl bg-white px-4 py-4 shadow-sm ring-1 ring-slate-200/80 transition transform hover:-translate-y-0.5 hover:shadow-md hover:ring-slate-300 sm:px-5"
                  >
                    <div
                      className="pointer-events-none absolute inset-x-0 top-0 h-1"
                      style={{
                        backgroundImage:
                          "linear-gradient(90deg,#64C247,#172965)",
                      }}
                    />

                    <div className="mt-1 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      {/* Left section */}
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <div
                            className="flex h-10 w-10 items-center justify-center rounded-xl text-xs font-semibold text-white shadow-sm sm:h-11 sm:w-11"
                            style={{
                              backgroundColor: JOB_BOARD_CONFIG.primaryColor,
                            }}
                          >
                            {job.employerInitials}
                          </div>

                          <div className="space-y-1.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <Link
                                href={detailFromListUrl}
                                className="text-sm font-semibold text-[#172965] hover:underline sm:text-base"
                              >
                                {job.title}
                              </Link>
                              <span className="inline-flex items-center rounded-full bg-slate-50 px-2.5 py-1 text-[0.65rem] font-medium text-slate-600 ring-1 ring-slate-200">
                                {job.department}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 sm:text-sm">
                              {job.employerName}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-[0.7rem] sm:text-xs">
                          <InfoPill
                            icon={<LocationIcon />}
                            label={job.location}
                          />
                          <InfoPill
                            icon={<BriefcaseIcon />}
                            label={`${job.workType} • ${job.type}`}
                          />
                          <InfoPill
                            icon={<SparklesIcon />}
                            label={`${job.seniority} level`}
                          />
                          {job.salaryRange && (
                            <InfoPill
                              icon={<CurrencyIcon />}
                              label={job.salaryRange}
                            />
                          )}
                        </div>

                        {job.highlight && (
                          <p className="mt-1.5 text-xs text-slate-700 sm:text-sm">
                            {job.highlight}
                          </p>
                        )}

                        {job.tags?.length ? (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {job.tags.map((tag) => (
                              <span
                                key={tag}
                                className="rounded-full bg-slate-100 px-2 py-0.5 text-[0.65rem] text-slate-600"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        ) : null}

                        <div className="mt-2 flex flex-wrap items-center gap-2 text-[0.7rem] text-slate-500 sm:text-xs">
                          <span className="font-medium text-slate-600">
                            Share:
                          </span>
                          <a
                            href={linkedInShareUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2.5 py-1 ring-1 ring-slate-200 hover:bg-slate-100"
                          >
                            <LinkedInIcon />
                            <span>LinkedIn</span>
                          </a>
                          <a
                            href={xShareUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2.5 py-1 ring-1 ring-slate-200 hover:bg-slate-100"
                          >
                            <XIcon />
                            <span>X</span>
                          </a>
                          <a
                            href={whatsAppShareUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2.5 py-1 ring-1 ring-slate-200 hover:bg-slate-100"
                          >
                            <WhatsAppIcon />
                            <span>WhatsApp</span>
                          </a>
                        </div>
                      </div>

                      {/* Right section */}
                      <div className="flex flex-col items-start gap-2 sm:items-end">
                        <div className="inline-flex items-center gap-1.5 text-[0.7rem] text-slate-500 sm:text-xs">
                          <ClockIcon />
                          <span>{job.postedAt}</span>
                        </div>

                        <Link
                          href={detailFromListUrl}
                          className="inline-flex items-center justify-center rounded-lg px-3.5 py-1.5 text-[0.7rem] font-medium text-white shadow-sm sm:text-xs"
                          style={{
                            backgroundColor: JOB_BOARD_CONFIG.primaryColor,
                          }}
                        >
                          View full brief
                          <span
                            className="ml-1.5 text-[0.65rem]"
                            aria-hidden="true"
                          >
                            →
                          </span>
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* Bottom candidate CTA */}
        <section className="mt-10 rounded-2xl bg-white px-5 py-6 shadow-sm ring-1 ring-slate-200 sm:px-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-[#172965]">
                Not sure which role fits yet?
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Use the talent network once. When we run a search that matches
                your profile, we reach out with context and a clear brief.
              </p>
            </div>
            <Link
              href={TALENT_NETWORK_BOTTOM_URL}
              className="inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium text-[#0b1c3d] shadow-sm hover:brightness-105"
              style={{ backgroundColor: JOB_BOARD_CONFIG.accentColor }}
            >
              Join the talent network
              <span className="ml-2 text-xs" aria-hidden="true">
                →
              </span>
            </Link>
          </div>
        </section>

        {/* For employers – SaaS hint */}
        <section className="mt-6 flex flex-col items-start justify-between gap-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-4 text-xs text-slate-600 sm:flex-row sm:items-center sm:px-6 sm:text-sm">
          <div>
            <p className="font-semibold text-slate-700">
              For employers & talent teams
            </p>
            <p className="mt-1 max-w-xl">
              Use this board to run searches with Resourcin, or white-label the
              experience as your own careers page — with self-serve posting for
              busy hiring managers.
            </p>
          </div>
          <Link
            href={EMPLOYER_CTA_URL}
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 sm:text-sm"
          >
            {JOB_BOARD_CONFIG.employerCtaLabel}
            <span className="ml-1.5 text-[0.7rem]" aria-hidden="true">
              →
            </span>
          </Link>
        </section>
      </main>
    </div>
  );
}
