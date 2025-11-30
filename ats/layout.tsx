// app/ats/layout.tsx
import Link from "next/link";
import { ReactNode } from "react";
import { usePathname } from "next/navigation";

// Because app/ats layout is a Server Component by default, we can't use
// usePathname directly here. We'll make a small client wrapper:
function AtsNav() {
  "use client";
  const pathname = usePathname();

  const links = [
    { href: "/ats/dashboard", label: "Dashboard" },
    { href: "/ats/jobs", label: "Jobs" },
    { href: "/ats/candidates", label: "Candidates" },
  ];

  const isActive = (href: string) => pathname?.startsWith(href);

  return (
    <nav className="space-y-1 text-sm">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={`flex items-center justify-between rounded-lg px-3 py-2 transition ${
            isActive(link.href)
              ? "bg-slate-900 text-slate-50"
              : "text-slate-700 hover:bg-slate-100"
          }`}
        >
          <span>{link.label}</span>
        </Link>
      ))}
    </nav>
  );
}

export default function AtsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex max-w-6xl gap-6 px-4 py-8">
      {/* Sidebar */}
      <aside className="hidden w-52 flex-shrink-0 flex-col gap-4 md:flex">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            ThinkATS
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-900">
            Applicant Tracking
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Tenant: Resourcin (internal)
          </p>
        </div>
        <AtsNav />
      </aside>

      {/* Main content */}
      <section className="flex-1">{children}</section>
    </div>
  );
}
