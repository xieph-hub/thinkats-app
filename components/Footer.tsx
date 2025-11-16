import Link from "next/link";
import Container from "./Container";

function SocialIcon({
  label,
  href,
  children,
}: {
  label: string;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      aria-label={label}
      target="_blank"
      rel="noreferrer"
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#FFC000] text-white text-sm font-semibold hover:bg-[#FFC000] hover:text-[#172965] transition-colors"
    >
      {children}
    </a>
  );
}

export default function Footer() {
  return (
    <footer className="mt-16 border-t-4 border-[#FFC000] bg-[#172965] text-white">
      <Container>
        <div className="py-10 lg:py-12">
          {/* Top section */}
          <div className="grid gap-8 md:grid-cols-3">
            {/* Brand & vision */}
            <div>
              <h3 className="text-lg font-semibold tracking-tight">
                Resourcin
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-white/80">
                African-focused talent acquisition and employer-of-record
                partner, helping high-growth teams hire graduate, experienced
                and executive talent across markets.
              </p>
            </div>

            {/* Navigation */}
            <div className="grid grid-cols-2 gap-6 text-sm">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-[0.16em] text-[#FFC000]">
                  For Candidates
                </h4>
                <ul className="mt-3 space-y-2">
                  <li>
                    <Link
                      href="/jobs"
                      className="text-white/80 hover:text-[#FFC000] transition-colors"
                    >
                      Browse Jobs
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/talent-network"
                      className="text-white/80 hover:text-[#FFC000] transition-colors"
                    >
                      Join Talent Network
                    </Link>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="text-xs font-semibold uppercase tracking-[0.16em] text-[#FFC000]">
                  For Employers
                </h4>
                <ul className="mt-3 space-y-2">
                  <li>
                    <Link
                      href="/employers"
                      className="text-white/80 hover:text-[#FFC000] transition-colors"
                    >
                      Services
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/request-talent"
                      className="text-white/80 hover:text-[#FFC000] transition-colors"
                    >
                      Request Talent
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/about"
                      className="text-white/80 hover:text-[#FFC000] transition-colors"
                    >
                      About Resourcin
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/contact"
                      className="text-white/80 hover:text-[#FFC000] transition-colors"
                    >
                      Contact
                    </Link>
                  </li>
                </ul>
              </div>
            </div>

            {/* Contact & social */}
            <div className="flex flex-col justify-between gap-4 md:items-end">
              <div className="text-sm md:text-right">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#FFC000]">
                  Talk to us
                </p>
                <p className="mt-2 text-white">
                  Phone:{" "}
                  <a
                    href="tel:+2347045572393"
                    className="font-medium hover:text-[#FFC000] transition-colors"
                  >
                    +234 704 557 2393
                  </a>
                </p>
              </div>

              <div className="md:text-right">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#FFC000]">
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
          <div className="mt-8 border-t border-white/10 pt-4 text-xs text-white/60 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <p>
              © {new Date().getFullYear()} Resourcin. All rights reserved.
            </p>
            <p className="flex flex-wrap items-center gap-2">
              <span>Built for African & global teams</span>
              <span className="hidden text-[#64C247] md:inline">•</span>
              <span className="text-[#64C247] md:text-inherit">
                Talent • Teams • Growth
              </span>
            </p>
          </div>
        </div>
      </Container>
    </footer>
  );
}
