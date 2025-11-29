// app/jobs/[jobIdOrSlug]/applied/page.tsx
import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

type PageProps = {
  params: { jobIdOrSlug: string };
};

type JobRow = {
  id: string;
  slug: string | null;
  title: string;
  location: string | null;
  short_description: string | null;
};

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.resourcin.com";

function looksLikeUuid(value: string): boolean {
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
    value,
  );
}

export default async function JobAppliedPage({ params }: PageProps) {
  const { jobIdOrSlug } = params;
  const isUuid = looksLikeUuid(jobIdOrSlug);

  let query = supabaseAdmin
    .from("jobs")
    .select(
      `
      id,
      slug,
      title,
      location,
      short_description
    `,
    )
    .eq("visibility", "public");

  if (isUuid) {
    query = query.eq("id", jobIdOrSlug);
  } else {
    query = query.eq("slug", jobIdOrSlug);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    console.error("Error loading job on applied page:", error);
  }

  const job = data as JobRow | null;

  const canonicalPath =
    job && (job.slug || job.id)
      ? `/jobs/${encodeURIComponent(job.slug ?? job.id)}`
      : "/jobs";

  const jobUrl = `${BASE_URL}${canonicalPath}`;
  const shareText = encodeURIComponent(
    job
      ? `${job.title}${job.location ? ` – ${job.location}` : ""} (via Resourcin)`
      : "Explore open roles via Resourcin",
  );
  const encodedUrl = encodeURIComponent(jobUrl);
  const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
  const xUrl = `https://twitter.com/intent/tweet?text=${shareText}&url=${encodedUrl}`;
  const whatsappUrl = `https://api.whatsapp.com/send?text=${shareText}%20${encodedUrl}`;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      {/* Header / confirmation hero */}
      <section className="border-b border-slate-200 bg-gradient-to-br from-white via-white to-[#172965]/4">
        <div className="mx-auto max-w-3xl px-4 py-10 sm:py-12">
          <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <Link
              href="/jobs"
              className="inline-flex items-center gap-1 hover:text-[#172965]"
            >
              ← All roles
            </Link>
            {job && (
              <>
                <span className="h-0.5 w-0.5 rounded-full bg-slate-300" />
                <Link
                  href={canonicalPath}
                  className="inline-flex items-center gap-1 hover:text-[#172965]"
                >
                  View role
                </Link>
              </>
            )}
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-[#172965] sm:text-3xl">
            Application received
          </h1>

          <p className="mt-3 text-sm text-slate-700">
            This is to acknowledge receipt of your application. A member of our
            recruitment team will reach out to you if you are a good fit for
            the role.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Link
              href="/jobs"
              className="inline-flex items-center justify-center rounded-full bg-[#172965] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#0f1c48]"
            >
              Back to all roles
            </Link>
            {job && (
              <Link
                href={canonicalPath}
                className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-[#172965] hover:bg-slate-50"
              >
                View role details
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Body: role summary + share */}
      <section className="mx-auto max-w-3xl px-4 py-8 sm:py-10">
        <div className="space-y-4">
          {job && (
            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Role applied for
              </h2>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                {job.title}
              </p>
              {job.location && (
                <p className="mt-1 text-xs text-slate-600">{job.location}</p>
              )}
              {job.short_description && (
                <p className="mt-3 text-xs text-slate-700">
                  {job.short_description}
                </p>
              )}
            </article>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-[11px] text-slate-600 shadow-sm">
            <div>
              <div className="text-[11px] font-semibold text-slate-800">
                Share Resourcin roles
              </div>
              <p className="mt-1 max-w-md">
                Know someone who might be a fit for this or another mandate?
                Share the careers page or this specific role with them.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={linkedInUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-50 hover:bg-slate-100"
                aria-label="Share on LinkedIn"
              >
                <LinkedInIcon />
              </a>
              <a
                href={xUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-50 hover:bg-slate-100"
                aria-label="Share on X"
              >
                <XIcon />
              </a>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-50 hover:bg-slate-100"
                aria-label="Share on WhatsApp"
              >
                <WhatsAppIcon />
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

// ---- SOCIAL ICONS (same visual language as /jobs) -------------------------

function LinkedInIcon() {
  return (
    <svg
      className="h-3.5 w-3.5 text-[#0A66C2]"
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="currentColor"
    >
      <path d="M4.98 3.5C4.98 4.88 3.88 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1 4.98 2.12 4.98 3.5zM.22 8.25h4.56V24H.22zM8.34 8.25h4.37v2.13h.06c.61-1.16 2.1-2.38 4.32-2.38 4.62 0 5.47 3.04 5.47 6.99V24h-4.56v-7.22c0-1.72-.03-3.93-2.4-3.93-2.4 0-2.77 1.87-2.77 3.8V24H8.34z" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg
      className="h-3.5 w-3.5 text-black"
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="currentColor"
    >
      <path d="M18.5 2h-3.1L12 7.2 8.8 2H2l6.7 10.1L2.4 22h3.1L12 14.7 16 22h6.8l-7-10.6L21.6 2h-3.1L14 8.4z" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg
      className="h-3.5 w-3.5 text-[#25D366]"
      viewBox="0 0 32 32"
      aria-hidden="true"
      fill="currentColor"
    >
      <path d="M16.04 4C9.96 4 5 8.96 5 15.02c0 2.38.72 4.6 2.09 6.5L5 28l6.63-2.07c1.84 1 3.9 1.53 6.01 1.53h.01C22.1 27.46 27 22.5 27 16.44 27 10.38 22.12 4 16.04 4zm-.01 20.9c-1.8 0-3.56-.48-5.1-1.38l-.37-.22-3.93 1.23 1.28-3.84-.24-.39A8.7 8.7 0 0 1 7.3 15c0-4.84 3.93-8.78 8.77-8.78 4.77 0 8.66 3.94 8.66 8.78 0 4.83-3.9 8.9-8.66 8.9zm4.78-6.63c-.26-.13-1.53-.76-1.77-.84-.24-.09-.41-.13-.58.12-.17.26-.67.84-.82 1-.15.17-.3.19-.56.06-.26-.13-1.09-.4-2.08-1.28-.77-.69-1.29-1.54-1.44-1.8-.15-.26-.02-.4.11-.53.12-.12.26-.3.39-.45.13-.15.17-.26.26-.43.09-.17.04-.32-.02-.45-.06-.13-.58-1.39-.8-1.9-.21-.5-.42-.44-.58-.45l-.5-.01c-.17 0-.45.06-.69.32-.24.26-.9.88-.9 2.14 0 1.26.92 2.48 1.05 2.65.13.17 1.81 2.86 4.4 4.02.62.27 1.11.43 1.49.55.63.2 1.2.17 1.65.1.5-.08 1.53-.62 1.75-1.22.22-.6.22-1.11.15-1.22-.06-.11-.24-.17-.5-.3z" />
    </svg>
  );
}
