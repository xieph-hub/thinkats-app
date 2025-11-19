// app/talent-network/page.tsx

import TalentNetworkForm from "./TalentNetworkForm";

function humanizeSlug(slug: string) {
  if (!slug) return "";

  const base = slug.replace(/[-_]+/g, " ").trim();
  if (!base) return "";

  // Title-case each word
  return base.replace(/\b\w/g, (c) => c.toUpperCase());
}

type TalentNetworkPageProps = {
  searchParams?: { [key: string]: string | string[] | undefined };
};

export default function TalentNetworkPage({
  searchParams = {},
}: TalentNetworkPageProps) {
  // We expect urls like:
  // /talent-network?utm_source=job_detail&utm_campaign=senior-product-manager-fintech
  const rawCampaign = searchParams.utm_campaign;
  const campaignSlug =
    typeof rawCampaign === "string" ? rawCampaign : rawCampaign?.[0] || "";

  const prefillRole = campaignSlug ? humanizeSlug(campaignSlug) : "";

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Header copy */}
        <section className="mb-8 space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Talent Network
          </div>

          <div className="space-y-3">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              Share your profile once. We&apos;ll plug you into the right
              searches.
            </h1>
            <p className="text-sm text-slate-700 sm:text-base">
              This isn&apos;t a job board. It&apos;s a short, structured way
              for us to understand your experience, what you want next, and
              where you&apos;re strongest — so when a relevant search comes up,
              we can reach out with context, not guesswork.
            </p>
          </div>

          <div className="grid gap-3 rounded-2xl bg-white px-4 py-4 text-sm text-slate-700 shadow-sm ring-1 ring-slate-200 sm:grid-cols-3 sm:px-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                What you can expect
              </p>
              <ul className="mt-1 space-y-1 text-xs sm:text-sm">
                <li>• Human screening, not keyword robots.</li>
                <li>• If we reach out, it&apos;s for a real brief.</li>
                <li>• Honest feedback where we can give it.</li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Focus areas
              </p>
              <ul className="mt-1 space-y-1 text-xs sm:text-sm">
                <li>• Product, Engineering, Data.</li>
                <li>• People, Ops, Finance, Strategy.</li>
                <li>• Sales, Growth, Customer Success.</li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Already in process?
              </p>
              <p className="mt-1 text-xs sm:text-sm">
                Already in process for a role? You can still update your details
                here so we have the full picture.
              </p>
            </div>
          </div>
        </section>

        {/* Form */}
        <section className="mb-10">
          <TalentNetworkForm
            prefillRole={prefillRole}
            sourceJobSlugRaw={campaignSlug}
          />
        </section>

        {/* Footer */}
        <footer className="mt-6 border-t border-slate-200 pt-4 text-xs text-slate-500 sm:flex sm:items-center sm:justify-between">
          <div className="mb-2 sm:mb-0">
            <p className="font-medium text-slate-600">Resourcin</p>
            <p>Human capital advisory and recruitment partner for growth-focused businesses.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <a
              href="/jobs"
              className="text-xs font-medium text-[#172965] hover:underline"
            >
              Back to jobs
            </a>
          </div>
        </footer>
      </main>
    </div>
  );
}
