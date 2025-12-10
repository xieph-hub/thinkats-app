// components/careers/CareersShell.tsx
import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { Globe, Linkedin, Twitter, Instagram } from "lucide-react";

type CareersShellProps = {
  displayName: string;
  logoUrl: string | null;
  host: string;
  baseDomain: string | null;
  planTier: string;
  primaryColor: string;
  accentColor: string;
  heroBackground: string;
  websiteUrl: string | null;
  linkedinUrl?: string | null;
  twitterUrl?: string | null;
  instagramUrl?: string | null;
  /**
   * Controls which local nav item is highlighted.
   * We support a few keys but treat anything else as "no highlight".
   */
  activeNav?: "home" | "overview" | "careers" | "jobs" | "about";
  children: ReactNode;
};

export default function CareersShell(props: CareersShellProps) {
  const {
    displayName,
    logoUrl,
    host,
    baseDomain,
    planTier,
    primaryColor,
    accentColor,
    heroBackground,
    websiteUrl,
    linkedinUrl,
    twitterUrl,
    instagramUrl,
    activeNav,
    children,
  } = props;

  const navItems = [
    { key: "home", label: "Overview", href: "/" },
    { key: "jobs", label: "Jobs", href: "/jobs" },
    { key: "about", label: "About", href: "#about" },
  ] as const;

  const showJobsLink = true;
  const hasOnlinePresence =
    !!websiteUrl || !!linkedinUrl || !!twitterUrl || !!instagramUrl;

  const year = new Date().getFullYear();

  // Helper to strip protocol for nicer display
  const displayHost = (url: string) =>
    url.replace(/^https?:\/\//i, "").replace(/\/$/, "");

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      {/* Top bar – tenant-level only, no ThinkATS product nav */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 lg:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-slate-900 ring-1 ring-slate-800">
              {logoUrl ? (
                <Image
                  src={logoUrl}
                  alt={displayName}
                  width={36}
                  height={36}
                  className="h-9 w-9 object-contain"
                />
              ) : (
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
                  {displayName.slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-semibold text-slate-50">
                  {displayName}
                </h1>
                <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[9px] font-medium uppercase tracking-[0.18em] text-slate-400">
                  {planTier}
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                {host}
                {baseDomain ? ` · powered by ThinkATS` : ""}
              </p>
            </div>
          </div>

          {/* Local nav – Overview / Jobs / About */}
          <nav className="hidden items-center gap-4 text-[11px] text-slate-300 sm:flex">
            {navItems.map((item) => {
              const isActive =
                (item.key === "home" &&
                  (activeNav === "home" || activeNav === "overview")) ||
                activeNav === item.key;

              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className={
                    "rounded-full px-3 py-1 transition " +
                    (isActive
                      ? "bg-slate-800 text-slate-50"
                      : "text-slate-300 hover:bg-slate-900 hover:text-slate-50")
                  }
                >
                  {item.label}
                </Link>
              );
            })}
            {websiteUrl && (
              <Link
                href={websiteUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-700/70 px-3 py-1 text-[10px] text-slate-300 hover:border-slate-500 hover:text-slate-50"
              >
                <Globe className="h-3.5 w-3.5" />
                <span className="truncate max-w-[140px]">
                  {displayHost(websiteUrl)}
                </span>
              </Link>
            )}
          </nav>
        </div>
      </header>

      {/* Main hub layout: sidebar + content */}
      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 lg:flex-row lg:px-6 lg:py-8">
        {/* Sidebar – company summary, meta, quick links */}
        <aside className="w-full shrink-0 space-y-4 lg:w-64">
          <div
            className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 text-xs text-slate-200"
            style={{
              backgroundImage:
                "radial-gradient(circle at top left, rgba(148, 163, 253, 0.24), transparent 55%)",
            }}
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              Overview
            </p>
            <p className="mt-2 text-sm font-medium text-slate-50">
              {displayName}
            </p>
            <p className="mt-1 text-[11px] text-slate-300">
              A dedicated hiring hub for this organisation — roles, insights and
              candidate experience in one place.
            </p>
            {showJobsLink && (
              <Link
                href="/jobs"
                className="mt-3 inline-flex items-center rounded-full bg-slate-50 px-3 py-1.5 text-[11px] font-medium text-slate-950 hover:bg-slate-200"
              >
                View open jobs
                <span className="ml-1.5 text-[13px]">↗</span>
              </Link>
            )}
          </div>

          <div className="space-y-2 rounded-2xl border border-slate-800 bg-slate-900/70 p-4 text-[11px] text-slate-300">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Workspace details
            </p>
            <div className="mt-1 space-y-1.5">
              <div className="flex justify-between gap-2">
                <span className="text-slate-400">Plan</span>
                <span className="font-medium text-slate-100">{planTier}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-slate-400">Hub URL</span>
                <span className="truncate font-mono text-[10px] text-slate-200">
                  {host}
                </span>
              </div>
              {baseDomain && (
                <div className="flex justify-between gap-2">
                  <span className="text-slate-400">Base domain</span>
                  <span className="truncate font-mono text-[10px] text-slate-200">
                    {baseDomain}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Online presence – website + socials */}
          {hasOnlinePresence && (
            <div className="space-y-2 rounded-2xl border border-slate-800 bg-slate-900/70 p-4 text-[11px] text-slate-300">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Online presence
              </p>
              <div className="mt-2 space-y-1.5">
                {websiteUrl && (
                  <Link
                    href={websiteUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 text-slate-100 hover:text-slate-50"
                  >
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-800">
                      <Globe className="h-3 w-3" />
                    </span>
                    <span className="truncate">
                      {displayHost(websiteUrl)}
                    </span>
                  </Link>
                )}
                {linkedinUrl && (
                  <Link
                    href={linkedinUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 text-slate-200 hover:text-slate-50"
                  >
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-800">
                      <Linkedin className="h-3 w-3" />
                    </span>
                    <span className="truncate">
                      LinkedIn
                    </span>
                  </Link>
                )}
                {twitterUrl && (
                  <Link
                    href={twitterUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 text-slate-200 hover:text-slate-50"
                  >
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-800">
                      <Twitter className="h-3 w-3" />
                    </span>
                    <span className="truncate">
                      X (Twitter)
                    </span>
                  </Link>
                )}
                {instagramUrl && (
                  <Link
                    href={instagramUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 text-slate-200 hover:text-slate-50"
                  >
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-800">
                      <Instagram className="h-3 w-3" />
                    </span>
                    <span className="truncate">
                      Instagram
                    </span>
                  </Link>
                )}
              </div>
            </div>
          )}

          <div className="space-y-2 rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-[10px] text-slate-400">
            <p>
              This hub is powered by{" "}
              <span className="font-semibold text-slate-200">ThinkATS</span> —
              multi-tenant ATS & careers infrastructure for modern HR and talent
              teams.
            </p>
          </div>
        </aside>

        {/* Main content – your configurable layout + jobs */}
        <section
          className="flex-1 space-y-6 rounded-2xl border border-slate-800 bg-slate-900/80 p-4 sm:p-5"
          style={{ backgroundColor: heroBackground }}
        >
          {children}
        </section>
      </main>

      {/* Footer – subtle, tenant-first, small ThinkATS credit */}
      <footer className="border-t border-slate-900/70 bg-slate-950/90 py-4">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-2 px-4 text-[10px] text-slate-500 sm:flex-row sm:items-center lg:px-6">
          <span>
            © {year} {displayName}. All rights reserved.
          </span>
          <span>
            Hiring infrastructure by{" "}
            <span className="font-semibold text-slate-300">ThinkATS</span>
          </span>
        </div>
      </footer>
    </div>
  );
}
