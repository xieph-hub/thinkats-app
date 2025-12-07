// app/ats/tenants/[tenantId]/users/InviteUserForm.tsx
"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

type Props = {
  tenantId: string;
};

const ROLE_OPTIONS = [
  { value: "owner", label: "Owner" },
  { value: "admin", label: "Admin" },
  { value: "recruiter", label: "Recruiter" },
  { value: "hiring_manager", label: "Hiring manager" },
];

export default function InviteUserForm({ tenantId }: Props) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("admin");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!email.trim()) {
      setError("Enter an email address.");
      return;
    }

    setStatus("submitting");
    setError(null);

    try {
      const res = await fetch(`/api/ats/tenants/${tenantId}/users/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok || !json?.ok) {
        const code = json?.error as string | undefined;
        let message = "Unable to send invite.";

        if (code === "invite_already_sent") {
          message = "An active invitation already exists for this email.";
        } else if (code === "already_member") {
          message = "This user is already a member of the workspace.";
        } else if (code === "invalid_email") {
          message = "Enter a valid email address.";
        }

        setStatus("error");
        setError(message);
        return;
      }

      setStatus("success");
      setEmail("");
      setRole("admin");
      router.refresh();
    } catch (err) {
      console.error("Invite teammate error", err);
      setStatus("error");
      setError("Something went wrong while sending the invite.");
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-2 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs md:flex-row md:items-end"
    >
      <div className="flex-1">
        <label className="mb-1 block text-[11px] font-medium text-slate-700">
          Work email
        </label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="teammate@company.com"
          className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 outline-none ring-0 focus:border-[#172965] focus:ring-2 focus:ring-[#172965]/10"
        />
      </div>

      <div className="w-full md:w-40">
        <label className="mb-1 block text-[11px] font-medium text-slate-700">
          Role
        </label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 outline-none ring-0 focus:border-[#172965] focus:ring-2 focus:ring-[#172965]/10"
        >
          {ROLE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex w-full flex-col gap-1 md:w-auto">
        <button
          type="submit"
          disabled={status === "submitting"}
          className="inline-flex items-center justify-center rounded-full bg-[#172965] px-4 py-1.5 text-[11px] font-semibold text-white shadow-sm transition hover:bg-[#101d4a] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {status === "submitting" ? "Sending…" : "Invite teammate"}
        </button>
        {status === "success" && (
          <p className="text-[10px] text-emerald-600">
            Invitation sent. We&apos;ll email them a link to join.
          </p>
        )}
        {error && (
          <p className="text-[10px] text-rose-600">
            {error}
          </p>
        )}
      </div>
    </form>
  );
}
