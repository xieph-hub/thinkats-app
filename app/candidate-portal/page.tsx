// app/candidate-portal/page.tsx
import CandidatePortalClient from "./CandidatePortalClient";

export const metadata = {
  title: "Candidate portal | Resourcin",
  description:
    "Check the status of your applications with Resourcin using the email you applied with.",
};

export default function CandidatePortalPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#306B34]">
            For candidates
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            Candidate portal
          </h1>
          <p className="mt-3 text-sm text-slate-600 sm:text-base">
            Use the email you applied with to see your active applications,
            stages, and status updates.
          </p>
        </header>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <CandidatePortalClient />
        </div>
      </section>
    </main>
  );
}
