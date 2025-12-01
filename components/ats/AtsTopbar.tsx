// components/ats/AtsTopbar.tsx
"use client";

import { useState } from "react";
import type { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

type Props = {
  user: User;
};

function getInitialsFromUser(user: User): string {
  const fullName =
    (user.user_metadata && (user.user_metadata as any).full_name) || "";
  const source = fullName || user.email || "";
  if (!source) return "TA";
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export default function AtsTopbar({ user }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const router = useRouter();

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setMenuOpen(false);
      router.push("/");
      router.refresh();
    } catch (e) {
      // optional: toast
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6 lg:px-8">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <span className="font-semibold text-slate-900">ATS workspace</span>
        <span className="text-slate-300">•</span>
        <span className="hidden text-slate-500 sm:inline">
          Logged in as {user.email}
        </span>
      </div>
      <div className="relative">
        <button
          type="button"
          onClick={() => setMenuOpen((prev) => !prev)}
          className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50"
        >
          <span className="hidden text-xs text-slate-500 sm:inline">
            Account
          </span>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
            {getInitialsFromUser(user)}
          </div>
        </button>
        {menuOpen && (
          <div className="absolute right-0 mt-2 w-44 rounded-md border border-slate-200 bg-white py-1 text-sm shadow-lg">
            <div className="px-3 pb-2 pt-1 text-xs text-slate-500">
              {user.email}
            </div>
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                router.push("/ats");
              }}
              className="block w-full px-3 py-1.5 text-left text-slate-700 hover:bg-slate-50"
            >
              ATS dashboard
            </button>
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="block w-full px-3 py-1.5 text-left text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loggingOut ? "Logging out…" : "Log out"}
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
