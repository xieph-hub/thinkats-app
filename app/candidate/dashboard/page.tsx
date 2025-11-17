// app/candidate/dashboard/page.tsx
import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentCandidate } from "@/lib/auth-candidate";

export default async function CandidateDashboardPage() {
  const candidate = await getCurrentCandidate();

  if (!candidate) {
    redirect("/login?from=candidate");
  }

  const firstName = candidate.fullName?.split(" ")[0] || candidate.email;

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#306B34]">
              Candidate portal
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-900 sm:text-3xl">
              Welcome back, {firstName}
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Manage your profile and keep track of roles you&apos;ve shared
              your details for via Resourcin.
            </p>
          </div>

          <form
            action="/api/candidate/logout"
            method="post"
            className="self-start"
          >
            <button className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
              Sign out
            </button>
          </form>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          {/* Left – applications */}
          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-slate-900">
                Your applications
              </h2>
              <span className="text-xs text-slate-500">
                {candidate.applications.length}{" "}
                {candidate.applications.length === 1
                  ? "application"
                  : "applications"}
              </span>
            </div>

            {candidate.applications.length === 0 ? (
              <p className="mt-3 text-sm text-slate-600">
                You haven&apos;t shared your profile for any specific roles yet.
                You can start from the{" "}
                <Link
                  href="/jobs"
                  className="font-medium text-[#172965] underline-offset-2 hover:underline"
                >
                  open roles
                </Link>{" "}
                or via the{" "}
                <Link
                  href="/talent-network"
                  className="font-medium text-[#172965] underline-offset-2 hover:underline"
                >
                  talent network
                </Link>
                .
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {candidate.applications.map((app) => (
                  <div
                    key={app.id}
                    className="flex flex-col gap-1.5 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 text-sm sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-medium text-slate-900">
                        {app.job?.title ?? "Role"}
                      </p>
                      <p className="text-xs text-slate-500">
                        {app.job?.location}{" "}
                        {app.job?.employmentType
                          ? `• ${app.job.employmentType}`
                          : null}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Applied on{" "}
                        {new Date(app.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex flex-col items-start gap-1 text-xs sm:items-end">
                      <span className="inline-flex items-center rounded-full bg-slate-900 px-2 py-0.5 text-[0.7rem] font-medium uppercase tracking-wide text-slate-50">
                        {app.stage}
                      </span>
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[0.7rem] font-medium text-slate-700">
                        {app.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Right – profile snapshot */}
          <aside className="space-y-4">
            <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
              <h2 className="text-sm font-semibold text-slate-900">
                Profile snapshot
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Clients see a structured profile based on what you share here.
              </p>

              <dl className="mt-4 space-y-2 text-sm text-slate-700">
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-500">Name</dt>
                  <dd className="text-right">
                    {candidate.fullName || "Not set"}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-500">Email</dt>
                  <dd className="text-right">{candidate.email}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-500">Current role</dt>
                  <dd className="text-right">
                    {candidate.currentRole || "Not set"}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-500">Location</dt>
                  <dd className="text-right">
                    {candidate.location || "Not set"}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-500">Years of experience</dt>
                  <dd className="text-right">
                    {candidate.yearsOfExperience != null
                      ? `${candidate.yearsOfExperience}+`
                      : "Not set"}
                  </dd>
                </div>
              </dl>

              <Link
                href="/candidate/profile"
                className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-50 hover:bg-black"
              >
                Edit your profile
              </Link>
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
}
