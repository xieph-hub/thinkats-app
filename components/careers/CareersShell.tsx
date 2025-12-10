// components/careers/CareersShell.tsx
import type { ReactNode } from "react";
import Link from "next/link";

type ActiveNav = "home" | "careers" | "jobs";

interface CareersShellProps {
  displayName: string;
  logoUrl: string | null;

  // Host + plan info (from getHostContext + tenant)
  host: string;
  baseDomain: string;
  planTier: string; // e.g. "STARTER" | "GROWTH" | "AGENCY" | "ENTERPRISE"

  // Branding (usually derived from CareerSiteSettings / CareerTheme)
  primaryColor: string; // hex, e.g. "#172965"
  accentColor: string; // hex, e.g. "#0ea5e9"
  heroBackground: string; // hex, e.g. "#F9FAFB"

  // Optional public company site
  websiteUrl?: string | null;

  // Which tab to highlight
  activeNav?: ActiveNav;

  // Page content goes here
  children: ReactNode;
}

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
    activeNav = "careers",
    children,
  } = props;

  const isUnderMainDomain =
    host === baseDomain || host.endsWith(`.${baseDomain}`);

  const upperTier = (planTier || "").toUpperCase();
  const isEnterprisePlan = upperTier === "ENTERPRISE";

  // Only Enterprise + custom domain can fully remove "Powered by"
  const canRemoveBranding = isEnterprisePlan && !isUnderMainDomain;
  const showPoweredBy = !canRemoveBranding;

  const navItemBase =
    "rounded-full px-3 py-1 text-[11px] font-semibold transition";

  const careersActive = activeNav === "careers";
  const jobsActive = activeNav === "jobs";

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
          {/* Top bar: logo + mini-nav */}
          <div
            className="flex flex-col gap-4 border-b px-6 py-4 sm:flex-row sm:items-center sm:justify-between"
            style={{ background: heroBackground }}
          >
            <div className="flex items-center gap-3">
              {logoUrl ? (
                <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={logoUrl}
                    alt={displayName}
                    className="h-full w-full object-contain"
                  />
                </div>
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}

              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {displayName}
                </p>
                <p className="text-[11px] text-slate-500">Careers</p>
              </div>
            </div>

            {/* Tenant mini-nav – NOT the ThinkATS marketing nav */}
            <nav className="flex flex-wrap items-center gap-3 text-xs font-medium text-slate-600">
              <Link
                href="/careers"
                className={`${navItemBase} ${
                  careersActive
                    ? "bg-white/80 text-slate-900 shadow-sm"
                    : "hover:bg-white/60 hover:text-slate-900"
                }`}
              >
                Careers home
              </Link>

              <Link
                href="/jobs"
                className={`${navItemBase} ${
                  jobsActive
                    ? "bg-white/80 text-slate-900 shadow-sm"
                    : "hover:bg-white/60 hover:text-slate-900"
                }`}
              >
                Open roles
              </Link>

              {websiteUrl && (
                <a
                  href={websiteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] font-medium text-slate-600 hover:text-slate-900"
                >
                  Company site
                </a>
              )}

              <Link
                href="/login"
                className="rounded-full border px-3 py-1 text-[11px] font-semibold"
                style={{ borderColor: primaryColor, color: primaryColor }}
              >
                Admin login
              </Link>
            </nav>
          </div>

          {/* Page content */}
          <div className="px-6 py-7 lg:px-8 lg:py-9">
            {children}

            {showPoweredBy && (
              <footer className="mt-6 border-t border-slate-200 pt-3 text-[10px] text-slate-400">
                Powered by{" "}
                  <span
                    className="font-medium"
                    style={{ color: accentColor || "#0f172a" }}
                  >
                    ThinkATS
                  </span>
                .
              </footer>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
