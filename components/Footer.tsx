import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-800 bg-[#172965] text-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Top section */}
        <div className="grid gap-8 md:grid-cols-[1.6fr,1fr]">
          {/* Brand + blurb */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-xs font-black tracking-tight text-white">
                R
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-sm font-semibold text-white">
                  Resourcin
                </span>
                <span className="text-[11px] text-slate-200/80">
                  Human Capital Advisors
                </span>
              </div>
            </div>
            <p className="max-w-md text-sm text-slate-200/80">
              Resourcin partners with growth-focused companies to design lean
              teams, build recruiting engines, and keep people operations tidy
              and board-ready from day one.
            </p>
          </div>

          {/* Contact + social */}
          <div className="space-y-3 md:text-right">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
              Contact
            </p>
            <p className="text-sm text-slate-100">
              Phone:{" "}
              <a
                href="tel:+2347045572393"
                className="font-medium text-slate-50 hover:underline"
              >
                +234 704 557 2393
              </a>
            </p>

            <div className="mt-2 flex flex-wrap items-center gap-3 md:justify-end">
              <a
                href="https://www.linkedin.com/company/resourcin"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-50 ring-1 ring-white/15 hover:bg-white/10"
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-bold text-[#172965]">
                  in
                </span>
                LinkedIn
              </a>

              <a
                href="https://x.com/resourcinhq"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-50 ring-1 ring-white/15 hover:bg-white/10"
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-bold text-[#172965]">
                  X
                </span>
                X (Twitter)
              </a>

              <a
                href="https://www.instagram.com/resourcinhq/"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-50 ring-1 ring-white/15 hover:bg-white/10"
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-bold text-[#172965]">
                  IG
                </span>
                Instagram
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-slate-700/60">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-4 text-xs text-slate-300/80 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <span>
            © {new Date().getFullYear()} Resourcin Human Capital Advisors.
            All rights reserved.
          </span>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[11px] text-slate-300/80">
              Lagos • Remote-first delivery
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
