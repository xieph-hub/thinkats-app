// components/Footer.tsx
import Link from "next/link";

const currentYear = new Date().getFullYear();

export default function Footer() {
  return (
    <footer className="mt-10 border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Top section */}
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          {/* Brand / story */}
          <div className="max-w-sm space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#172965]/5 px-3 py-1 text-[11px] font-medium text-[#172965]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#64C247]" />
              Resourcin · ThinkATS
            </div>
            <p className="text-sm font-semibold text-[#172965]">
              Modern recruitment for founders, operators and HR teams.
            </p>
            <p className="text-xs leading-relaxed text-slate-600">
              Resourcin runs senior searches and hard-to-fill mandates. ThinkATS
              powers the jobs, pipelines and career sites you see across this
              workspace.
            </p>
          </div>

          {/* Link columns */}
          <div className="flex flex-1 flex-wrap gap-8 text-xs">
            <FooterColumn
              label="Product"
              links={[
                { href: "/product", label: "Overview" },
                { href: "/career-sites", label: "Career sites" },
                { href: "/jobs", label: "Live roles" },
              ]}
            />
            <FooterColumn
              label="For employers"
              links={[
                { href: "/jobs", label: "View mandates" },
                { href: "/contact", label: "Talk to Resourcin" }, // if /contact exists
                { href: "/ats/jobs", label: "ATS dashboard" }, // internal, if you’ve exposed it
              ]}
            />
            <FooterColumn
              label="Company"
              links={[
                { href: "/", label: "Home" },
                { href: "/insights", label: "Insights" }, // your Notion CMS page
                { href: "/about", label: "About Resourcin" }, // if /about exists
              ]}
            />
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 text-[11px] text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {currentYear} Resourcin / ThinkATS. All rights reserved.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            {/* You can wire these to real URLs once your social pages are live */}
            <span className="text-slate-400">Social (coming soon):</span>
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] font-medium text-slate-700">
              LinkedIn
            </span>
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] font-medium text-slate-700">
              X (Twitter)
            </span>
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] font-medium text-slate-700">
              Instagram
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

type FooterColumnProps = {
  label: string;
  links: { href: string; label: string }[];
};

function FooterColumn({ label, links }: FooterColumnProps) {
  return (
    <div className="space-y-2">
      <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </div>
      <ul className="space-y-1">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-[11px] text-slate-600 hover:text-[#172965]"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
