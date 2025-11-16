import Link from "next/link";

function LinkedInIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      {...props}
      className={`h-5 w-5 ${props.className ?? ""}`}
    >
      <path
        fill="currentColor"
        d="M4.98 3.5a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5zM3 9h4v12H3V9zm7 0h3.8v1.64h.05c.53-.98 1.82-2.02 3.74-2.02C21.42 8.62 22 11 22 13.9V21H18v-6.18c0-1.47-.03-3.36-2.05-3.36-2.05 0-2.37 1.6-2.37 3.25V21h-4V9z"
      />
    </svg>
  );
}

function XIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      {...props}
      className={`h-5 w-5 ${props.className ?? ""}`}
    >
      <path
        fill="currentColor"
        d="M18.9 3H21l-4.7 5.4L21.8 21h-4.9l-3.2-6.6L9.7 21H3.6l5-5.8L2.2 3h5l2.9 5.9L18.9 3zM17.9 19.7h1.3L8.3 4.2H7L17.9 19.7z"
      />
    </svg>
  );
}

function InstagramIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      {...props}
      className={`h-5 w-5 ${props.className ?? ""}`}
    >
      <path
        fill="currentColor"
        d="M12 7.3A4.7 4.7 0 1 0 16.7 12 4.71 4.71 0 0 0 12 7.3zm0 7.7A3 3 0 1 1 15 12a3 3 0 0 1-3 3zm4.9-7.9a1.1 1.1 0 1 1-1.1-1.1 1.1 1.1 0 0 1 1.1 1.1zM12 3.5c-2.4 0-2.7 0-3.6.1a5.4 5.4 0 0 0-3.8 1.5A5.4 5.4 0 0 0 3.1 8.9C3 9.8 3 10.1 3 12.5s0 2.7.1 3.6a5.4 5.4 0 0 0 1.5 3.8 5.4 5.4 0 0 0 3.8 1.5c.9.1 1.2.1 3.6.1s2.7 0 3.6-.1a5.4 5.4 0 0 0 3.8-1.5 5.4 5.4 0 0 0 1.5-3.8c.1-.9.1-1.2.1-3.6s0-2.7-.1-3.6a5.4 5.4 0 0 0-1.5-3.8 5.4 5.4 0 0 0-3.8-1.5c-.9-.1-1.2-.1-3.6-.1zm0-1.8c2.4 0 2.7 0 3.7.1a7.2 7.2 0 0 1 5 2 7.2 7.2 0 0 1 2 5c.1 1 .1 1.3.1 3.7s0 2.7-.1 3.7a7.2 7.2 0 0 1-2 5 7.2 7.2 0 0 1-5 2c-1 .1-1.3.1-3.7.1s-2.7 0-3.7-.1a7.2 7.2 0 0 1-5-2 7.2 7.2 0 0 1-2-5C1.1 15.2 1 14.9 1 12.5s0-2.7.1-3.7a7.2 7.2 0 0 1 2-5 7.2 7.2 0 0 1 5-2C9.3 1.7 9.6 1.7 12 1.7z"
      />
    </svg>
  );
}

export default function Footer() {
  return (
    <footer className="mt-12 bg-[#172965] text-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Top row */}
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          {/* Brand & tagline */}
          <div className="max-w-sm space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-sm font-semibold text-white">
                R
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-sm font-semibold tracking-wide">
                  Resourcin
                </span>
                <span className="text-[11px] text-slate-300">
                  Human Capital Advisors
                </span>
              </div>
            </div>
            <p className="text-xs leading-relaxed text-slate-200/80">
              We help growth-focused organisations attract, assess, and keep the
              talent that compounds value over time.
            </p>
          </div>

          {/* Links & contact */}
          <div className="grid flex-1 gap-8 text-sm sm:grid-cols-2 md:grid-cols-3">
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-200">
                Company
              </h3>
              <ul className="space-y-1.5 text-xs text-slate-200/80">
                <li>
                  <Link href="/about" className="hover:text-white">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="/services" className="hover:text-white">
                    Services
                  </Link>
                </li>
                <li>
                  <Link href="/jobs" className="hover:text-white">
                    Open Roles
                  </Link>
                </li>
                <li>
                  <Link href="/clients" className="hover:text-white">
                    For Employers
                  </Link>
                </li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-200">
                Contact
              </h3>
              <ul className="space-y-1.5 text-xs text-slate-200/80">
                <li>Phone: +234 704 557 2393</li>
                <li>
                  <a
                    href="https://www.linkedin.com/company/resourcin"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-white"
                  >
                    LinkedIn
                  </a>
                </li>
                <li>
                  <a
                    href="https://x.com/resourcinhq"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-white"
                  >
                    X (Twitter)
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.instagram.com/resourcinhq/"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-white"
                  >
                    Instagram
                  </a>
                </li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-200">
                Follow
              </h3>
              <div className="flex items-center gap-3">
                <a
                  href="https://www.linkedin.com/company/resourcin"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-slate-100 hover:bg-white/20"
                >
                  <LinkedInIcon />
                  <span className="sr-only">LinkedIn</span>
                </a>
                <a
                  href="https://x.com/resourcinhq"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-slate-100 hover:bg-white/20"
                >
                  <XIcon />
                  <span className="sr-only">X</span>
                </a>
                <a
                  href="https://www.instagram.com/resourcinhq/"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-slate-100 hover:bg-white/20"
                >
                  <InstagramIcon />
                  <span className="sr-only">Instagram</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom row */}
        <div className="mt-8 border-t border-white/10 pt-4 text-[11px] text-slate-300 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} Resourcin Human Capital Advisors
            Limited. All rights reserved.
          </p>
          <p className="text-slate-400">
            Built for founders, HR leaders, and hiring managers who care about
            compounding talent.
          </p>
        </div>
      </div>
    </footer>
  );
}
