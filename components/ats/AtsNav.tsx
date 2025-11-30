// components/ats/AtsNav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/ats/dashboard", label: "Dashboard" },
  { href: "/ats/jobs", label: "Jobs" },
  { href: "/ats/candidates", label: "Candidates" },
];

export default function AtsNav() {
  const pathname = usePathname();

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
