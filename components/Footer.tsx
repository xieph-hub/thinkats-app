import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-12 bg-[#172965] text-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <h3 className="text-sm font-semibold tracking-wide">Resourcin</h3>
            <p className="mt-2 text-xs text-slate-200/80">
              Human capital advisory and recruitment partner for growth-focused
              businesses.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-200/80">
              Contact
            </h4>
            <p className="mt-2 text-xs text-slate-100">
              Phone: <span className="font-medium">+234 704 557 2393</span>
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-200/80">
              Connect
            </h4>
            <div className="mt-2 flex flex-wrap gap-3 text-xs">
              <Link
                href="https://www.linkedin.com/company/resourcin"
                target="_blank"
                className="underline underline-offset-4 hover:text-[#FFC000]"
              >
                LinkedIn
              </Link>
              <Link
                href="https://x.com/resourcinhq"
                target="_blank"
                className="underline underline-offset-4 hover:text-[#FFC000]"
              >
                X
              </Link>
              <Link
                href="https://www.instagram.com/resourcinhq/"
                target="_blank"
                className="underline underline-offset-4 hover:text-[#FFC000]"
              >
                Instagram
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-6 border-t border-slate-700/60 pt-4 text-[11px] text-slate-300">
          © {new Date().getFullYear()} Resourcin Human Capital Advisors. All
          rights reserved.
        </div>
      </div>
    </footer>
  );
}
