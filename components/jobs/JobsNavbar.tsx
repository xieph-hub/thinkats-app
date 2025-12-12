// components/jobs/JobsNavbar.tsx
"use client";

import Link from "next/link";
import Image from "next/image";

export default function JobsNavbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <Link
            href="/jobs"
            className="flex items-center gap-2"
            aria-label="Jobs by ThinkATS"
          >
            <Image
              src="/thinkats-logo.svg"
              alt="ThinkATS"
              width={120}
              height={34}
              className="h-8 w-auto"
              priority
            />
          </Link>

          <span className="hidden sm:inline-flex items-center rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
            Jobs by ThinkATS
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Back to ThinkATS
          </Link>
          <Link
            href="/signup"
            className="rounded-full bg-[#1E40AF] px-3 py-1.5 text-[12px] font-semibold text-white shadow-sm hover:bg-[#1D3A9A]"
          >
            Post roles
          </Link>
        </div>
      </nav>
    </header>
  );
}
