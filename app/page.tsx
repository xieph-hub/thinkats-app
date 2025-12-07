// app/page.tsx
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getHostContext } from "@/lib/host";

export const metadata: Metadata = {
  title: "ThinkATS | Hiring workspaces & careers",
  description:
    "ThinkATS powers modern hiring workspaces, shared pipelines and branded careers sites for companies and agencies.",
};

export default function HomePage() {
  const { isPrimaryHost, tenantSlugFromHost } = getHostContext();

  // 🔹 If we're on a tenant subdomain (e.g. resourcin.thinkats.com),
  // treat the root as THEIR app entry point → straight into their login.
  if (!isPrimaryHost && tenantSlugFromHost) {
    redirect("/login");
  }

  // 🔹 Primary host (thinkats.com / www.thinkats.com):
  // your marketing homepage lives here.
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto flex max-w-6xl flex-col gap-12 px-4 pb-16 pt-20 lg:flex-row lg:items-center lg:pt-24">
        {/* Left: hero copy */}
        <section className="flex-1 space-y-5">
          <p className="inline-flex items-center rounded-full bg-slate-900/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-400">
            THINKATS · HIRING WORKSPACES
          </p>

          <h1 className="text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl">
            One ATS for teams, clients
            <span className="block text-sky-400">and branded careers sites.</span>
          </h1>

          <p className="max-w-xl text-sm text-slate-300 sm:text-base">
            ThinkATS gives recruiters, founders and in-house People teams a shared
            workspace for roles, pipelines and talent — plus white-label careers
            sites for every client or business unit.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <a
              href="/signup"
              className="inline-flex items-center rounded-full bg-sky-500 px-5 py-2.5 text-sm font-semibold text-slate-950 shadow-md shadow-sky-500/25 hover:bg-sky-400"
            >
              Start a workspace
              <span className="ml-1.5 text-xs">↗</span>
            </a>
            <a
              href="/jobs"
              className="inline-flex items-center rounded-full border border-slate-600 px-4 py-2 text-xs font-medium text-slate-100 hover:border-slate-400 hover:text-white"
            >
              View live roles on ThinkATS
            </a>
          </div>

          <div className="mt-4 grid gap-3 text-xs text-slate-300 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3">
              <p className="font-semibold text-slate-50">Shared pipelines</p>
              <p className="mt-1 text-[11px] text-slate-400">
                Track every role from brief to offer with structured stages and
                notes.
              </p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3">
              <p className="font-semibold text-slate-50">Client-branded careers</p>
              <p className="mt-1 text-[11px] text-slate-400">
                Give each client or business unit their own careers site on a
                subdomain.
              </p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3">
              <p className="font-semibold text-slate-50">Candidate-first flows</p>
              <p className="mt-1 text-[11px] text-slate-400">
                Candidates apply once and can be matched across suitable roles.
              </p>
            </div>
          </div>
        </section>

        {/* Right: simple visual card */}
        <section className="flex-1">
          <div className="mx-auto w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl shadow-sky-500/15">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              Snapshot
            </p>
            <h2 className="mt-2 text-lg font-semibold text-slate-50">
              How teams use ThinkATS
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              One workspace for roles, candidates and clients — with a careers site
              for each tenant.
            </p>

            <div className="mt-4 space-y-3 text-[11px] text-slate-300">
              <div className="flex items-start gap-2 rounded-xl bg-slate-950/60 p-3">
                <span className="mt-[3px] h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <div>
                  <p className="font-medium text-slate-50">
                    Resourcin ATS · resourcin.thinkats.com
                  </p>
                  <p className="mt-0.5 text-slate-400">
                    Internal roles and client mandates in a single pipeline view.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2 rounded-xl bg-slate-950/60 p-3">
                <span className="mt-[3px] h-1.5 w-1.5 rounded-full bg-sky-400" />
                <div>
                  <p className="font-medium text-slate-50">
                    Careers · resourcin.thinkats.com/careers
                  </p>
                  <p className="mt-0.5 text-slate-400">
                    Candidates see Resourcin&apos;s brand, while the underlying
                    ATS runs on ThinkATS.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2 rounded-xl bg-slate-950/60 p-3">
                <span className="mt-[3px] h-1.5 w-1.5 rounded-full bg-amber-400" />
                <div>
                  <p className="font-medium text-slate-50">Jobs on ThinkATS</p>
                  <p className="mt-0.5 text-slate-400">
                    Selected roles opt into the global marketplace at thinkats.com.
                  </p>
                </div>
              </div>
            </div>

            <p className="mt-5 border-t border-slate-800 pt-3 text-[10px] text-slate-500">
              Already have a workspace? Go straight to{" "}
              <a
                href="/login"
                className="font-medium text-sky-400 hover:text-sky-300"
              >
                login
              </a>
              .
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
