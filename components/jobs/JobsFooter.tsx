// components/jobs/JobsFooter.tsx
import Link from "next/link";

export default function JobsFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900">
              Jobs by ThinkATS
            </p>
            <p className="mt-1 text-[12px] text-slate-600">
              A curated jobs hub powered by ThinkATS.
            </p>
            <p className="mt-3 text-[11px] text-slate-500">
              © {year} ThinkATS. All rights reserved.
            </p>
          </div>

          <div className="flex flex-wrap gap-x-5 gap-y-2 text-[12px] font-medium text-slate-700">
            <Link href="/product" className="hover:text-[#1E40AF]">
              Product
            </Link>
            <Link href="/career-sites" className="hover:text-[#1E40AF]">
              Career sites
            </Link>
            <Link href="/pricing" className="hover:text-[#1E40AF]">
              Pricing
            </Link>
            <Link href="/contact" className="hover:text-[#1E40AF]">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
