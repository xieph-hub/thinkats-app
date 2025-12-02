"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type AccountMenuProps = {
  email: string | null;
};

export default function AccountMenu({ email }: AccountMenuProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const safeEmail = email ?? "";

  // Basic initials from the email before the "@"
  const initials =
    safeEmail
      .split("@")[0]
      .split(/[.\s_-]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "TA";

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.error("Logout failed", err);
    } finally {
      setOpen(false);
      router.push("/login");
      router.refresh();
    }
  }

  return (
    <div className="relative">
      {/* Pill button – truncated and responsive */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex max-w-[230px] items-center gap-2 rounded-full border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
      >
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-[11px] font-semibold text-slate-100">
          {initials}
        </div>

        {/* Hide the text on very small screens, truncate on wider ones */}
        <div className="hidden min-w-0 flex-col text-left sm:flex">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            Account
          </span>
          <span className="truncate text-xs text-slate-700">
            {safeEmail}
          </span>
        </div>
      </button>

      {/* Dropdown – fixed width, overflow handled */}
      {open && (
        <div className="absolute right-0 z-40 mt-2 w-60 max-w-[260px] overflow-hidden rounded-xl border border-slate-200 bg-white py-2 text-sm text-slate-800 shadow-xl">
          <div className="px-3 pb-2 text-xs text-slate-500">
            <div className="truncate font-medium text-slate-800">
              {safeEmail}
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              router.push("/ats");
              setOpen(false);
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-slate-50"
          >
            ATS dashboard
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-red-600 hover:bg-red-50"
          >
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
