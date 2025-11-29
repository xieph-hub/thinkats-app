// app/jobs/[jobIdOrSlug]/apply/page.tsx
// ...
// inside default export after we have `job`:

const canonicalPath = job.slug
  ? `/jobs/${encodeURIComponent(job.slug)}`
  : `/jobs/${encodeURIComponent(job.id)}`;

// ...

// 🔹 Internal tracking source for multi-tenant analytics
const rawSrcParam =
  typeof searchParams?.src === "string"
    ? searchParams.src
    : Array.isArray(searchParams?.src)
    ? searchParams.src[0]
    : undefined;

const trackingSource =
  rawSrcParam && rawSrcParam.trim().length > 0
    ? rawSrcParam.trim().toUpperCase()
    : "CAREERS_SITE";

return (
  <main className="min-h-screen bg-slate-50 text-slate-900">
    {/* Header / breadcrumbs ... stays exactly as you have it */}

    <section className="mx-auto max-w-5xl px-4 py-8 sm:py-10">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr),minmax(260px,1fr)]">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          {/* ... header text ... */}

          <div className="mt-4 border-t border-slate-100 pt-4">
            <JobApplyForm
              jobId={job.id}
              source={trackingSource}
              jobPublicId={job.slug ?? job.id}  // ✅ NEW
            />
          </div>
        </article>

        {/* Right-hand Role snapshot + referrals card (unchanged) */}
      </div>
    </section>
  </main>
);
