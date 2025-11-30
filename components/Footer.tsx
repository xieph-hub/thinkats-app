// components/Footer.tsx
import Link from "next/link";

const YEAR = new Date().getFullYear();

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white/90">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8 lg:flex-row lg:items-start lg:justify-between">
        {/* Brand + tagline */}
        <div className="max-w-sm space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#172965]/5 px-3 py-1 text-[11px] font-medium text-[#172965]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#64C247]" />
            ThinkATS · Multi-tenant ATS
          </div>
          <h2 className="text-sm font-semibold text-slate-900">
            Built for agencies, in-house teams and ambitious founders.
          </h2>
          <p className="text-xs text-slate-600">
            ThinkATS helps you run pipelines, launch career sites and keep
            everyone aligned on “who&apos;s where” in the hiring process.
          </p>
          <p className="text-[11px] text-slate-500">
            Connecting Talent with Opportunity, redefining workplaces and
            careers.
          </p>
        </div>

        {/* Link columns */}
        <div className="grid flex-1 gap-6 text-xs text-slate-600 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Product
            </p>
            <ul className="space-y-1.5">
              <li>
                <Link
                  href="/product"
                  className="hover:text-[#172965]"
                >
                  Overview
                </Link>
              </li>
              <li>
                <Link
                  href="/product/features/ats"
                  className="hover:text-[#172965]"
                >
                  ATS &amp; pipelines
                </Link>
              </li>
              <li>
                <Link
                  href="/career-sites"
                  className="hover:text-[#172965]"
                >
                  Career sites engine
                </Link>
              </li>
              <li>
                <Link
                  href="/product/features/automation"
                  className="hover:text-[#172965]"
                >
                  Automation &amp; emails
                </Link>
              </li>
              <li>
                <Link
                  href="/product/features/analytics"
                  className="hover:text-[#172965]"
                >
                  Analytics &amp; reporting
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Solutions
            </p>
            <ul className="space-y-1.5">
              <li>
                <Link
                  href="/solutions#in-house"
                  className="hover:text-[#172965]"
                >
                  In-house HR teams
                </Link>
              </li>
              <li>
                <Link
                  href="/solutions#agencies"
                  className="hover:text-[#172965]"
                >
                  Recruitment agencies
                </Link>
              </li>
              <li>
                <Link
                  href="/solutions#founders"
                  className="hover:text-[#172965]"
                >
                  Founders &amp; execs
                </Link>
              </li>
              <li>
                <Link
                  href="/jobs"
                  className="hover:text-[#172965]"
                >
                  Live roles (Resourcin)
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Resources
            </p>
            <ul className="space-y-1.5">
              <li>
                <Link
                  href="/resources"
                  className="hover:text-[#172965]"
                >
                  Guides &amp; playbooks
                </Link>
              </li>
              <li>
                <Link
                  href="/resources#workflows"
                  className="hover:text-[#172965]"
                >
                  Hiring workflows
                </Link>
              </li>
              <li>
                <Link
                  href="/resources#candidate-experience"
                  className="hover:text-[#172965]"
                >
                  Candidate experience
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Company &amp; legal
            </p>
            <ul className="space-y-1.5">
              {/* You can wire these later when you add proper pages */}
              {/* <li><Link href="/company" className="hover:text-[#172965]">About ThinkATS</Link></li> */}
              <li>
                <Link
                  href="/legal/terms"
                  className="hover:text-[#172965]"
                >
                  Terms of use
                </Link>
              </li>
              <li>
                <Link
                  href="/legal/privacy"
                  className="hover:text-[#172965]"
                >
                  Privacy notice
                </Link>
              </li>
              <li className="pt-1">
                <p className="text-[11px] text-slate-500">
                  ThinkATS is currently operated by Resourcin as
                  tenant zero.
                </p>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom strip */}
      <div className="border-t border-slate-200 bg-white/95">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-4 text-[11px] text-slate-500 sm:flex-row sm:px-6 lg:px-8">
          <p>
            © {YEAR} ThinkATS. All rights reserved.
          </p>
          <div className="flex items-center gap-3">
            {/* Social placeholders – you can swap hrefs once profiles exist */}
            <span className="text-slate-400">Socials (coming soon):</span>
            <div className="flex items-center gap-1.5">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 text-[11px] text-slate-500">
                in
              </span>
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 text-[11px] text-slate-500">
                X
              </span>
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 text-[11px] text-slate-500">
                🌐
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
