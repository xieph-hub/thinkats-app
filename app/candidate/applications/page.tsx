export default function CandidateApplicationsPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-neutral-800 bg-neutral-950/70 p-6">
        <h2 className="text-xl font-semibold mb-2">Applications</h2>
        <p className="text-sm text-neutral-400 mb-4">
          This page will list all the roles you&apos;ve applied for via
          Resourcin, with status updates.
        </p>
        <ul className="list-disc pl-5 text-xs text-neutral-400 space-y-1">
          <li>Job title, company, location</li>
          <li>Date applied</li>
          <li>Current status (Applied, In review, Interview, Offer, etc.)</li>
          <li>Links back to the job description</li>
        </ul>
      </section>
    </div>
  );
}
