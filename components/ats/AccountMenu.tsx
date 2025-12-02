// components/ats/AccountMenu.tsx
"use client";

import { useState } from "react";
import type { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

type Props = {
  user: User;
};

export default function AccountMenu({ user }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const email = user.email ?? "";
  const initials =
    (user.user_metadata?.full_name as string | undefined)
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || email.slice(0, 2).toUpperCase();

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore network errors, just force nav to login
    } finally {
      setOpen(false);
      router.push("/login");
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-2 py-1.5 text-left shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
          {initials}
        </div>
        <div className="hidden min-w-0 flex-col sm:flex">
          <span className="text-[11px] font-medium leading-tight text-slate-900">
            Account
          </span>
          <span className="max-w-[160px] truncate text-[11px] text-slate-500">
            {email}
          </span>
        </div>
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-3 text-sm shadow-lg">
          <div className="mb-3 border-b border-slate-100 pb-3">
            <p className="text-xs font-medium text-slate-900">Signed in as</p>
            <p className="mt-0.5 max-w-full break-all text-xs text-slate-500">
              {email}
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
            <span>ATS dashboard</span>
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
  );
}
