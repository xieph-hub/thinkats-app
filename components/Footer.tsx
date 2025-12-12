// components/Footer.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();

  // No marketing footer inside the ATS app
  if (pathname?.startsWith("/ats")) {
    return null;
  }

  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 sm:px-6 lg:px-8">
        {/* Top row */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-[#1E40AF]" aria-hidden="true" />
            <p className="text-sm font-semibold text-slate-900">ThinkATS</p>
            <span className="text-xs text-slate-500">
              Multi-tenant hiring infrastructure for modern teams.
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm">
            <Link
              href="/product"
              className="text-slate-600 transition hover:text-[#1E40AF]"
            >
              Product
            </Link>
            <Link
              href="/pricing"
              className="text-slate-600 transition hover:text-[#1E40AF]"
            >
              Pricing
            </Link>
            <Link
              href="/resources"
              className="text-slate-600 transition hover:text-[#1E40AF]"
            >
              Resources
            </Link>
            <Link
              href="/contact"
              className="text-slate-600 transition hover:text-[#1E40AF]"
            >
              Contact
            </Link>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px w-full bg-slate-100" />

        {/* Bottom row */}
        <div className="flex flex-col gap-3 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} ThinkATS. All rights reserved.</p>

          <div className="flex flex-wrap items-center gap-4">
            <Link href="/privacy" className="transition hover:text-slate-900">
              Privacy
            </Link>
            <Link href="/terms" className="transition hover:text-slate-900">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
