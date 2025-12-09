// app/page.tsx
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getHostContext } from "@/lib/host";

export const metadata: Metadata = {
  title: "ThinkATS | Hiring workspaces & careers",
  description:
    "ThinkATS powers modern hiring workspaces, shared pipelines and branded careers sites for companies and agencies.",
};

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const hostCtx = await getHostContext();
  const {
    isPrimaryHost,
    isAppHost,
    tenant,
    careerSiteSettings,
  } = hostCtx;

  // ────────────────────────────────────────────────────────────────
  // 1) Primary app host → global ThinkATS marketing homepage
  //    (thinkats.com / www.thinkats.com)
  // ────────────────────────────────────────────────────────────────
  if (isPrimaryHost || isAppHost || !tenant) {
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

  // ────────────────────────────────────────────────────────────────
  // 2) Tenant host → tenant mini-home (white card, branded)
  //    e.g. human-capital-partners.thinkats.com
  // ────────────────────────────────────────────────────────────────

  const tenantName = tenant.name || tenant.slug;
  const logoUrl =
    (careerSiteSettings as any)?.logoUrl || tenant.logoUrl || null;

  const primaryColor =
    (careerSiteSettings as any)?.primaryColorHex || "#172965";
  const accentColor =
    (careerSiteSettings as any)?.accentColorHex || "#0ea5e9";
  const heroBackground =
    (careerSiteSettings as any)?.heroBackgroundHex || "#F9FAFB";

  const heroTitle =
    (careerSiteSettings as any)?.heroTitle || `Careers at ${tenantName}`;
  const heroSubtitle =
    (careerSiteSettings as any)?.heroSubtitle ||
    "Explore open roles, learn about the team and apply in a few clicks.";

  const aboutHtml = (careerSiteSettings as any)?.aboutHtml as string | null;

  // Public open roles for this tenant (mirrors careers page filtering)
  const openRolesCount = await prisma.job.count({
    where: {
      tenantId: tenant.id,
      status: "open",
      visibility: "public",
      OR: [{ internalOnly: false }, { internalOnly: null }],
    },
  });

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto max-w-5xl px-4 py-10 lg:py-16">
        <div
          className="overflow-hidden rounded-3xl border bg-white shadow-xl"
          style={{
            borderColor: primaryColor,
            boxShadow: "0 22px 60px rgba(15,23,42,0.16)",
          }}
        >
          {/* Top bar: logo + tenant mini-nav */}
          <div
            className="flex flex-col gap-4 border-b px-6 py-4 sm:flex-row sm:items-center sm:justify-between"
            style={{ background: heroBackground }}
          >
            <div className="flex items-center gap-3">
              {logoUrl ? (
                <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-white">
                  {/* Using plain img to avoid Next image domain config headaches */}
                  <img
                    src={logoUrl}
                    alt={tenantName || "Company logo"}
                    className="h-full w-full object-contain"
                  />
                </div>
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
                  {tenantName?.charAt(0)?.toUpperCase() ?? "?"}
                </div>
              )}
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {tenantName}
                </p>
                <p className="text-[11px] text-slate-500">Hiring workspace</p>
              </div>
            </div>

            {/* Tenant mini-nav */}
            <nav className="flex flex-wrap items-center gap-3 text-xs font-medium text-slate-600">
              <a href="/careers" className="hover:text-slate-900">
                Careers
              </a>
              <a href="/jobs" className="hover:text-slate-900">
                Open roles
              </a>
              {tenant.websiteUrl && (
                <a
                  href={tenant.websiteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-slate-900"
                >
                  Company site
                </a>
              )}
              <a
                href="/login"
                className="rounded-full border px-3 py-1 text-[11px] font-semibold"
                style={{ borderColor: primaryColor, color: primaryColor }}
              >
                Admin login
              </a>
            </nav>
          </div>

          {/* Main content */}
          <div className="flex flex-col gap-8 px-6 py-7 lg:flex-row lg:items-start lg:px-8 lg:py-9">
            {/* Left: hero text & CTAs */}
            <section className="flex-1 space-y-3">
              <p
                className="inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]"
                style={{
                  backgroundColor: "#EEF2FF",
                  color: primaryColor,
                }}
              >
                {tenantName} · Careers
              </p>

              <h1
                className="text-2xl font-semibold leading-tight sm:text-3xl"
                style={{ color: primaryColor }}
              >
                {heroTitle}
              </h1>

              <p className="max-w-xl text-sm text-slate-600 sm:text-[15px]">
                {heroSubtitle}
              </p>

              {aboutHtml && (
                <p className="max-w-xl whitespace-pre-line text-xs text-slate-600">
                  {aboutHtml}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <a
                  href="/jobs"
                  className="inline-flex items-center rounded-full px-4 py-2 text-xs font-semibold text-white"
                  style={{ backgroundColor: primaryColor }}
                >
                  View {openRolesCount || "open"} role
                  {openRolesCount === 1 ? "" : "s"}
                  <span className="ml-1.5 text-[11px]">↗</span>
                </a>
                <a
                  href="/careers"
                  className="inline-flex items-center rounded-full border px-4 py-2 text-[11px] font-medium text-slate-700 hover:bg-slate-50"
                  style={{ borderColor: accentColor }}
                >
                  Visit full careers page
                </a>
              </div>

              <p className="mt-3 text-[11px] text-slate-500">
                No account needed — candidates can view roles and apply
                directly. Admins and hiring managers use{" "}
                <span className="font-medium">Admin login</span> to access the
                ATS workspace.
              </p>
            </section>

            {/* Right: small status & stats panel */}
            <aside className="w-full max-w-sm rounded-2xl border border-slate-100 bg-slate-50/80 p-4 text-[11px] text-slate-700">
              <h2 className="text-xs font-semibold text-slate-900">
                Hiring snapshot
              </h2>

              <dl className="mt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <dt className="text-[11px] text-slate-500">Workspace</dt>
                  <dd className="text-[11px] font-medium text-slate-900">
                    {tenantName}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-[11px] text-slate-500">
                    Public open roles
                  </dt>
                  <dd className="text-[11px] font-semibold text-slate-900">
                    {openRolesCount}
                  </dd>
                </div>
                {tenant.industry && (
                  <div className="flex items-center justify-between">
                    <dt className="text-[11px] text-slate-500">Industry</dt>
                    <dd className="text-[11px] font-medium text-slate-900">
                      {tenant.industry}
                    </dd>
                  </div>
                )}
                {(tenant.city || tenant.state || tenant.country) && (
                  <div className="flex items-center justify-between">
                    <dt className="text-[11px] text-slate-500">Location</dt>
                    <dd className="text-[11px] font-medium text-slate-900">
                      {[tenant.city, tenant.state, tenant.country]
                        .filter(Boolean)
                        .join(", ")}
                    </dd>
                  </div>
                )}
              </dl>

              <p className="mt-4 rounded-lg bg-white px-3 py-2 text-[10px] text-slate-500">
                You&apos;re viewing the public hiring home for{" "}
                <span className="font-medium text-slate-700">
                  {tenantName}
                </span>
                . All pipelines, notes and evaluations sit securely in the
                underlying ATS workspace.
              </p>

              <footer className="mt-4 border-t border-slate-200 pt-3">
                <p className="text-[10px] text-slate-400">
                  Powered by{" "}
                  <span className="font-medium text-slate-500">
                    ThinkATS
                  </span>
                  .
                </p>
              </footer>
            </aside>
          </div>
        </div>
      </div>
    </main>
  );
}
