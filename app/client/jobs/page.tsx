export default function ClientJobsPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-neutral-800 bg-neutral-950/70 p-6">
        <h2 className="text-xl font-semibold mb-2">Jobs</h2>
        <p className="text-sm text-neutral-400 mb-4">
          This page will show all roles you&apos;re hiring for through Resourcin.
        </p>
        <ul className="list-disc pl-5 text-xs text-neutral-400 space-y-1">
          <li>Job title, location, function, seniority</li>
          <li>Status (Open, On hold, Closed)</li>
          <li>Candidates per stage (New, Shortlisted, Interview, Offer, Hired)</li>
        </ul>
      </section>
    </div>
  );
}
