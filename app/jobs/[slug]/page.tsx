// app/jobs/[slug]/page.tsx

import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata, ResolvingMetadata } from "next";
import { prisma } from "@/lib/prisma";
import ApplyForm from "@/components/ApplyForm";

export const dynamic = "force-dynamic";

type PageProps = {
  params: { slug: string };
};

// 🔹 Dynamic metadata for SEO + social share cards
export async function generateMetadata(
  { params }: PageProps,
  _parent: ResolvingMetadata
): Promise<Metadata> {
  const job = await prisma.job.findUnique({
    where: { slug: params.slug },
  });

  if (!job || !job.isPublished) {
    return {
      title: "Job not found · Resourcin",
      description:
        "This role may no longer be available or the link might be incorrect.",
    };
  }

  const url = `https://www.resourcin.com/jobs/${job.slug}`;
  const baseDescription =
    job.excerpt ||
    job.description?.slice(0, 180) ||
    "View this opportunity via Resourcin.";
  const title = `${job.title}${
    job.location ? ` · ${job.location}` : ""
  } · Resourcin`;

  return {
    title,
    description: baseDescription,
    openGraph: {
      title,
      description: baseDescription,
      url,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: baseDescription,
    },
  };
}

// 🔹 Page component
export default async function JobPage({ params }: PageProps) {
  const job = await prisma.job.findUnique({
    where: { slug: params.slug },
  });

  if (!job || !job.isPublished) {
    notFound();
  }

  // At this point TS knows job is not null
  const jobUrl = `https://www.resourcin.com/jobs/${job!.slug}`;
  const shareText = encodeURIComponent(`${job!.title} – via Resourcin`);
  const twitterShare = `https://twitter.com/intent/tweet?text=${shareText}&url=${encodeURIComponent(
    jobUrl
  )}`;
  const linkedInShare = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
    jobUrl
  )}`;

  const isHtmlDescription =
    typeof job!.description === "string" &&
    /<\/?[a-z][\s\S]*>/i.test(job!.description);

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-8 md:py-10 space-y-8">
        {/* Back link */}
        <nav className="text-xs">
          <Link
            href="/jobs"
            className="inline-flex items-center gap-1 text-slate-500 hover:text-[#172965]"
          >
            <span aria-hidden>←</span>
            Back to all roles
          </Link>
        </nav>

        {/* Header + meta + share */}
        <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#172965]">
              Resourcin · Opportunity
            </p>
            <h1 className="text-2xl md:text-3xl font-semibold text-slate-900">
              {job!.title}
            </h1>
            <p className="text-xs text-slate-500">
              {job!.department && <span>{job!.department} · </span>}
              {job!.location && <span>{job!.location} · </span>}
              {job!.type && <span>{job!.type}</span>}
            </p>

            {job!.postedAt && (
              <p className="text-[11px] text-slate-400">
                Posted{" "}
                {new Date(job!.postedAt).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            )}
          </div>

          {/* Share / meta panel */}
          <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm flex flex-col gap-2 min-w-[220px]">
            <p className="text-[11px] font-semibold text-slate-700 uppercase tracking-[0.18em]">
              Share this role
            </p>
            <div className="flex flex-wrap gap-2">
              <a
                href={twitterShare}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] text-slate-700 hover:border-[#172965] hover:text-[#172965] transition"
              >
                <span className="mr-1" aria-hidden>
                  🐦
                </span>
                Twitter / X
              </a>
              <a
                href={linkedInShare}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] text-slate-700 hover:border-[#172965] hover:text-[#172965] transition"
              >
                <span className="mr-1" aria-hidden>
                  💼
                </span>
                LinkedIn
              </a>
            </div>
            <p className="text-[10px] text-slate-400">
              You can also copy the link:{" "}
              <span className="break-all text-slate-500">{jobUrl}</span>
            </p>
          </div>
        </header>

        {/* Layout: description + apply */}
        <section className="grid gap-8 md:grid-cols-[minmax(0,2fr),minmax(0,1.2fr)]">
          {/* Left: Job content */}
          <article className="space-y-6">
            {/* About section */}
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
              <h2 className="text-sm font-semibold text-slate-900">
                About the role
              </h2>
              {job!.excerpt && (
                <p className="text-sm text-slate-700">{job!.excerpt}</p>
              )}
              <div className="h-px bg-slate-100" />
              <div className="prose prose-sm max-w-none text-slate-700">
                {isHtmlDescription ? (
                  <div
                    dangerouslySetInnerHTML={{ __html: job!.description }}
                  />
                ) : (
                  <p className="whitespace-pre-line">{job!.description}</p>
                )}
              </div>
            </section>

            {/* Meta section */}
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-2 text-xs text-slate-600">
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-700">
                Role details
              </h3>
              <div className="grid gap-2 sm:grid-cols-2">
                {job!.location && (
                  <div>
                    <p className="text-[11px] text-slate-400">Location</p>
                    <p>{job!.location}</p>
                  </div>
                )}
                {job!.type && (
                  <div>
                    <p className="text-[11px] text-slate-400">Engagement</p>
                    <p>{job!.type}</p>
                  </div>
                )}
                {job!.department && (
                  <div>
                    <p className="text-[11px] text-slate-400">Department</p>
                    <p>{job!.department}</p>
                  </div>
                )}
                {job!.postedAt && (
                  <div>
                    <p className="text-[11px] text-slate-400">Posted</p>
                    <p>
                      {new Date(job!.postedAt).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                )}
              </div>
            </section>
          </article>

          {/* Right: Apply card */}
          <div className="space-y-4">
            <ApplyForm jobTitle={job!.title} jobId={job!.id} />
            <div className="rounded-xl border border-slate-200 bg-white p-4 text-[11px] text-slate-500 shadow-sm">
              <p>
                We review every application carefully. If there&apos;s a strong
                fit, we&apos;ll reach out to discuss next steps. Even if this
                isn&apos;t the right role, we may keep your profile in view for
                future mandates.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
