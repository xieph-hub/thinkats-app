import Link from "next/link";

type SocialIconProps = {
  label: string;
  href: string;
  children: React.ReactNode;
};

function SocialIcon({ label, href, children }: SocialIconProps) {
  return (
    <a
      href={href}
      aria-label={label}
      target="_blank"
      rel="noreferrer"
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/30 text-xs font-semibold text-white hover:bg-white hover:text-[#172965] transition-colors"
    >
      {children}
    </a>
  );
}

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 border-t border-white/10 bg-[#172965] text-white">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Top grid */}
        <div className="py-10 lg:py-12 grid gap-8 md:grid-cols-3">
          {/* Brand / positioning */}
          <div>
            <h3 className="text-lg font-semibold tracking-tight">
              Resourcin
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-white/80">
              African-focused talent acquisition and employer-of-record partner,
              helping high-growth teams hire graduate, experienced, and executive
              talent across markets.
            </p>
            <p className="mt-3 inline-flex items-center rounded-full bg-[#306B34] px-3 py-1 text-xs font-medium tracking-wide text-white/90">
              Talent • Teams • Growth
            </p>
          </div>

          {/* Navigation links */}
          <div className="grid grid-cols-2 gap-6 text-sm">
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-[0.16em] text-white/70">
                For Candidates
              </h4>
              <ul className="mt-3 space-y-2">
                <li>
                  <Link
                    href="/jobs"
                    className="text-white/80 hover:text-[#64C247] transition-colors"
                  >
                    Browse Jobs
                  </Link>
                </li>
                <li>
                  <Link
                    href="/talent-network"
                    className="text-white/80 hover:text-[#64C247] transition-colors"
                  >
                    Join Talent Network
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-[0.16em] text-white/70">
                For Employers
              </h4>
              <ul className="mt-3 space-y-2">
                <li>
                  <Link
                    href="/employers"
                    className="text-white/80 hover:text-[#64C247] transition-colors"
                  >
                    Services
                  </Link>
                </li>
                <li>
                  <Link
                    href="/request-talent"
                    className="text-white/80 hover:text-[#64C247] transition-colors"
                  >
                    Request Talent
                  </Link>
                </li>
                <li>
                  <Link
                    href="/about"
                    className="text-white/80 hover:text-[#64C247] transition-colors"
                  >
                    About Resourcin
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contact"
                    className="text-white/80 hover:text-[#64C247] transition-colors"
                  >
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Contact + social */}
          <div className="flex flex-col justify-between gap-4 md:items-end">
            <div className="text-sm md:text-right">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/70">
                Talk to us
              </p>
              <p className="mt-2 text-white">
                Phone:{" "}
                <a
                  href="tel:+2347045572393"
                  className="font-medium hover:text-[#64C247] transition-colors"
                >
                  +234 704 557 2393
                </a>
              </p>
            </div>

            <div className="md:text-right">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/70">
                Follow Resourcin
              </p>
              <div className="mt-3 flex items-center gap-3 md:justify-end">
                <SocialIcon
                  label="LinkedIn"
                  href="https://www.linkedin.com/company/resourcin"
                >
                  in
                </SocialIcon>
                <SocialIcon
                  label="X (Twitter)"
                  href="https://x.com/resourcinhq"
                >
                  X
                </SocialIcon>
                <SocialIcon
                  label="Instagram"
                  href="https://www.instagram.com/resourcinhq/"
                >
                  IG
                </SocialIcon>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 py-4 text-xs text-white/70 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <p>© {year} Resourcin. All rights reserved.</p>
          <p className="flex flex-wrap items-center gap-2">
            <span>Built for African & global teams.</span>
            <span className="h-1 w-1 rounded-full bg-[#64C247]" />
            <span className="text-[#64C247]">
              Blue • Green. Your talent stack.
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
}
