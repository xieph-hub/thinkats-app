// components/ats/AtsTopbar.tsx
"use client";

import type { User } from "@supabase/supabase-js";
import AccountMenu from "./AccountMenu";

type Props = {
  user: User;
};

export default function AtsTopbar({ user }: Props) {
  const email = user.email ?? "";

  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-white/80 px-4 py-3 backdrop-blur sm:px-6 lg:px-8">
      <div className="min-w-0">
        <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-slate-400">
          ATS workspace
        </p>
        <p className="mt-1 text-sm text-slate-600">
          <span className="hidden sm:inline">Logged in as&nbsp;</span>
          <span className="font-medium text-slate-900">{email}</span>
        </p>
      </div>

      <AccountMenu user={user} />
    </header>
  );
}
