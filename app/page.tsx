// app/page.tsx
import type { Metadata } from "next";
import { getHostContext } from "@/lib/host";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "ThinkATS | Hiring workspaces & careers",
  description:
    "ThinkATS powers modern hiring workspaces, shared pipelines and branded careers sites for companies and agencies.",
};

export const dynamic = "force-dynamic";

export default async function HomePage() {
  // 🔧 FIX: getHostContext is async
  const { isPrimaryHost, tenantSlugFromHost } = await getHostContext();

  // 🔹 1) Primary host → global marketing homepage (unchanged)
  if (isPrimaryHost || !tenantSlugFromHost) {
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
              <span className="block text-sky-400">
                and branded careers sites.
              </span>
            </h1>

            <p className="max-w-xl text-sm text-slate-300 sm:text-base">
              ThinkATS gives recruiters, founders and in-house People teams a
              shared workspace for roles, pipelines and talent — plus
              white-label careers sites for every client or business unit.
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
              <a
                href="/login"
                className="inline-flex items-center rounded-full border border-slate-600 px-4 py-2 text-xs font-medium text-slate-100 hover:border-slate-400 hover:text-white"
              >
                Admin login
              </a>
            </div>

            <div className="mt-4 grid gap-3 text-xs text-slate-300 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3">
                <p className="font-semibold text-slate-50">Shared pipelines</p>
                <p className="mt-1 text-[11px] text-slate-400">
                  Track every role from brief to offer with structured stages
                  and notes.
                </p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3">
                <p className="font-semibold text-slate-50">
                  Client-branded careers
                </p>
                <p className="mt-1 text-[11px] text-slate-400">
                  Give each client or business unit their own careers site on a
                  subdomain.
                </p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3">
                <p className="font-semibold text-slate-50">
                  Candidate-first flows
                </p>
                <p className="mt-1 text-[11px] text-slate-400">
                  Candidates apply once and can be matched across suitable
                  roles.
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
                One workspace for roles, candidates and clients — with a careers
                site for each tenant.
              </p>

              <div className="mt-4 space-y-3 text-[11px] text-slate-300">
                <div className="flex items-start gap-2 rounded-xl bg-slate-950/60 p-3">
                  <span className="mt-[3px] h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <div>
                    <p className="font-medium text-slate-50">
                      Resourcin ATS · resourcin.thinkats.com
                    </p>
                    <p className="mt-0.5 text-slate-400">
                      Internal roles and client mandates in a single pipeline
                      view.
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
                      Candidates see Resourcin&apos;s brand, while the
                      underlying ATS runs on ThinkATS.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2 rounded-xl bg-slate-950/60 p-3">
                  <span className="mt-[3px] h-1.5 w-1.5 rounded-full bg-amber-400" />
                  <div>
                    <p className="font-medium text-slate-50">
                      Jobs on ThinkATS
                    </p>
                    <p className="mt-0.5 text-slate-400">
                      Selected roles opt into the global marketplace at
                      thinkats.com.
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

  // 🔹 2) Tenant host → tenant hiring workspace front page (public)
  const tenant = await prisma.tenant.findFirst({
    where: { slug: tenantSlugFromHost },
    select: {
      name: true,
      slug: true,
      logoUrl: true,
    },
  });

  const tenantName = tenant?.name || tenantSlugFromHost;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 pb-16 pt-16 lg:flex-row lg:items-center">
        {/* Left: tenant hiring hero */}
        <section className="flex-1 space-y-4">
          <p className="inline-flex items-center rounded-full bg-slate-900/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-400">
            {tenantName} · Hiring workspace
          </p>

          <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">
            Work at {tenantName}
          </h1>

          <p className="max-w-xl text-sm text-slate-300 sm:text-base">
            Explore open roles, learn about the team and apply in a few clicks.
            This workspace is powered by ThinkATS but fully branded for{" "}
            {tenantName}.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <a
              href="/jobs"
              className="inline-flex items-center rounded-full bg-sky-500 px-5 py-2.5 text-sm font-semibold text-slate-950 shadow-md shadow-sky-500/25 hover:bg-sky-400"
            >
              View open roles
              <span className="ml-1.5 text-xs">↗</span>
            </a>
            <a
              href="/careers"
              className="inline-flex items-center rounded-full border border-slate-600 px-4 py-2 text-xs font-medium text-slate-100 hover:border-slate-400 hover:text-white"
            >
              Visit careers page
            </a>
            <a
              href="/login"
              className="inline-flex items-center rounded-full border border-slate-600 px-4 py-2 text-xs font-medium text-slate-100 hover:border-slate-400 hover:text-white"
            >
              Admin login
            </a>
          </div>

          <p className="mt-4 text-[11px] text-slate-500">
            Admins and hiring managers can log in to their ATS dashboard via{" "}
            <span className="font-medium">Admin login</span>. Candidates never
            need an account to view roles or apply.
          </p>
        </section>

        {/* Right: simple tenant card */}
        <section className="flex-1">
          <div className="mx-auto w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl shadow-sky-500/15">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              {tenantName} hiring at a glance
            </p>
            <p className="mt-2 text-xs text-slate-400">
              Candidates see {tenantName}&apos;s branding on this site. Behind
              the scenes, roles, pipelines and feedback are managed in the ATS
              for this tenant.
            </p>

            <ul className="mt-4 space-y-2 text-[11px] text-slate-300">
              <li className="flex items-start gap-2">
                <span className="mt-[3px] h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span>
                  Public careers & job listings stay open without login.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-[3px] h-1.5 w-1.5 rounded-full bg-sky-400" />
                <span>
                  Admins use the same domain to access their ATS dashboard at{" "}
                  <code className="rounded bg-slate-950/70 px-1.5 py-0.5">
                    /ats
                  </code>
                  .
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-[3px] h-1.5 w-1.5 rounded-full bg-amber-400" />
                <span>
                  All activity is scoped to this tenant, even though it runs on
                  ThinkATS.
                </span>
              </li>
            </ul>

            <p className="mt-5 border-t border-slate-800 pt-3 text-[10px] text-slate-500">
              Powered by{" "}
              <a
                href="https://thinkats.com"
                className="font-medium text-sky-400 hover:text-sky-300"
              >
                ThinkATS
              </a>
              .
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
