import type { ReactNode } from "react";
import Link from "next/link";

export default function CandidateLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-black text-neutral-100">
      <div className="max-w-6xl mx-auto px-4 py-10 grid gap-8 md:grid-cols-[220px,1fr]">
        {/* Sidebar */}
        <aside className="space-y-6">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-neutral-500">
              Candidate
            </p>
            <h1 className="text-lg font-semibold mt-1">
              Your Resourcin profile
            </h1>
            <p className="text-xs text-neutral-500 mt-1">
              Manage your details, applications and documents in one place.
            </p>
          </div>

          <nav className="space-y-2 text-sm">
            <Link
              href="/candidate"
              className="block rounded-md px-3 py-2 hover:bg-neutral-900"
            >
              Dashboard
            </Link>
            <Link
              href="/candidate/profile"
              className="block rounded-md px-3 py-2 hover:bg-neutral-900"
            >
              Profile
            </Link>
            <Link
              href="/candidate/applications"
              className="block rounded-md px-3 py-2 hover:bg-neutral-900"
            >
              Applications
            </Link>
            <Link
              href="/candidate/documents"
              className="block rounded-md px-3 py-2 hover:bg-neutral-900"
            >
              Documents
            </Link>
            <Link
              href="/candidate/settings"
              className="block rounded-md px-3 py-2 hover:bg-neutral-900"
            >
              Settings
            </Link>
          </nav>
        </aside>

        {/* Main content */}
        <main>{children}</main>
      </div>
    </div>
  );
}
