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
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <p>© {year} ThinkATS. All rights reserved.</p>
        <div className="flex flex-wrap items-center gap-4">
          <Link href="/privacy" className="hover:text-slate-900">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-slate-900">
            Terms
          </Link>
          <span className="text-xs text-slate-400">
            Multi-tenant hiring infrastructure for modern teams.
          </span>
        </div>
      </div>
    </footer>
  );
}
