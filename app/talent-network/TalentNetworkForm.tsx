// app/talent-network/TalentNetworkForm.tsx
"use client";

import { useState } from "react";

type TalentNetworkFormProps = {
  prefillRole?: string;
};

export default function TalentNetworkForm({
  prefillRole = "",
}: TalentNetworkFormProps) {
  const [role, setRole] = useState(prefillRole);

  return (
    <form className="space-y-5">
      {/* ...other fields... */}

      <div className="space-y-1.5">
        <label
          htmlFor="roleInterested"
          className="text-sm font-medium text-slate-800"
        >
          Role you&apos;re most interested in next
        </label>
        <input
          id="roleInterested"
          name="roleInterested"
          type="text"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
          placeholder="e.g. Senior Product Manager – Fintech Platform"
        />
      </div>

      {/* ...submit button etc... */}
    </form>
  );
}
