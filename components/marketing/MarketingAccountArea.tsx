// components/marketing/MarketingAccountArea.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Props = {
  email?: string | null;
};

export default function MarketingAccountArea({ email }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const safeEmail = email ?? "";
  const initials =
    safeEmail
      .split("@")[0]
      .split(".")
      .filter(Boolean)
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "AT";

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore network error, just force nav
    } finally {
      setOpen(false);
      router.push("/");
    }
  }

  return (
    <div className="flex items-center gap-4">
      {/* Link into ATS workspace */}
      <Link
        href="/ats"
        className="hidden text-sm font-medium text-slate-700 hover:text-slate-900 sm:inline-flex"
      >
        ATS workspace
      </Link>

      {/* Logged-in pill */}
      <span className="hidden items-center gap-1 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 sm:inline-flex">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        Logged in
      </span>

      {/* Avatar + dropdown */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2 py-1.5 text-left shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
            {initials}
          </div>
          <div className="hidden min-w-0 flex-col sm:flex">
            <span className="text-[11px] font-medium leading-tight text-slate-900">
              Account
            </span>
            <span className="max-w-[150px] truncate text-[11px] text-slate-500">
              {safeEmail}
            </span>
          </div>
        </button>

        {open && (
          <div className="absolute right-0 z-40 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-3 text-sm shadow-lg">
            <div className="mb-3 border-b border-slate-100 pb-3">
              <p className="text-xs font-medium text-slate-900">Signed in as</p>
              <p className="mt-0.5 max-w-full break-all text-xs text-slate-500">
                {safeEmail}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setOpen(false);
                router.push("/ats");
              }}
              className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-xs text-slate-700 hover:bg-slate-50"
            >
              <span>Open ATS workspace</span>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="mt-1 flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-xs text-red-600 hover:bg-red-50"
            >
              <span>Log out</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
