import RequestTalentForm from "@/components/RequestTalentForm";

export const metadata = {
  title: "Request Talent | Resourcin",
  description:
    "Share your hiring brief with Resourcin — roles, locations, timelines, and budget. We’ll respond with next steps and a simple engagement plan.",
};

export default function RequestTalentPage() {
  return (
    <main className="bg-slate-50 min-h-screen">
      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#306B34]">
            For employers
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            Tell us what you&apos;re hiring for — we&apos;ll take it from there.
          </h1>
          <p className="mt-3 text-sm text-slate-600 sm:text-base">
            A short brief is enough: roles, locations, timelines, and ballpark
            budget. We&apos;ll respond with a simple plan, not a 30-page proposal.
          </p>
        </header>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <RequestTalentForm />

          <aside className="space-y-4 rounded-2xl border border-slate-200 bg-slate-900/95 p-5 text-slate-100">
            <h2 className="text-sm font-semibold">What happens next?</h2>
            <ol className="mt-2 space-y-2 text-xs text-slate-200">
              <li>1. We review your brief and clarify any gaps.</li>
              <li>2. You get a simple, written engagement roadmap.</li>
              <li>3. We align on commercials, timelines, and ownership.</li>
            </ol>
            <p className="mt-4 text-[11px] text-slate-400">
              For urgent mandates, mention your timeline clearly and we&apos;ll
              prioritise response.
            </p>
          </aside>
        </div>
      </section>
    </main>
  );
}
