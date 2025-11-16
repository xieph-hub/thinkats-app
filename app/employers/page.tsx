export default function EmployersPage() {
  return (
    <main className="py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-semibold text-slate-900 mb-4">
          Talent Acquisition & EOR for African and Global Teams
        </h1>
        <p className="text-slate-600 mb-6">
          Resourcin helps founders, HR leaders and global companies hire,
          onboard and support talent across Africa and remote hubs.
        </p>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900 mb-1">
              Talent Acquisition
            </h2>
            <p className="text-xs text-slate-600">
              Graduate programmes, experienced hires and leadership search.
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900 mb-1">
              Employer of Record (EOR)
            </h2>
            <p className="text-xs text-slate-600">
              Hire talent compliantly in new markets without opening entities.
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900 mb-1">
              RPO & Embedded Pods
            </h2>
            <p className="text-xs text-slate-600">
              On-demand recruiting squads plugged into your people operations.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
