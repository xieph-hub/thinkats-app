"use client";

import { useState } from "react";

type Props = {
  /** Optional so it compiles even if you forgot to pass it */
  tenantId?: string;
};

const ROLE_OPTIONS = [
  { value: "owner", label: "Owner" },
  { value: "admin", label: "Admin" },
  { value: "recruiter", label: "Recruiter" },
  { value: "hiring_manager", label: "Hiring manager" },
  { value: "viewer", label: "Viewer" },
];

export default function InviteUserForm({ tenantId }: Props) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("admin");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Try prop first, fall back to URL segment /ats/tenants/[tenantId]/users
    const effectiveTenantId =
      tenantId ||
      (typeof window !== "undefined"
        ? window.location.pathname.split("/")[3] // ['', 'ats', 'tenants', '{tenantId}', 'users']
        : "");

    if (!effectiveTenantId) {
      setError("Missing workspace reference. Please refresh and try again.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch(
        `/api/ats/tenants/${encodeURIComponent(
          effectiveTenantId,
        )}/users/invite`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, role }),
        },
      );

      const data = await res.json().catch(() => ({} as any));

      if (!res.ok) {
        const code = (data as any)?.error as string | undefined;

        switch (code) {
          case "invalid_email":
            setError("Enter a valid work email.");
            break;
          case "cannot_invite_self":
            setError("You can’t invite yourself to this workspace.");
            break;
          case "already_member":
            setError("That email already has access to this workspace.");
            break;
          case "invite_already_sent":
            setError("An active invite already exists for this email.");
            break;
          case "forbidden":
            setError("You don’t have permission to invite teammates here.");
            break;
          default:
            setError("Something went wrong while sending the invite.");
        }
        return;
      }

      setSuccess("Invite sent. We’ll refresh the list for you.");
      setEmail("");
      setRole("admin");

      // Refresh so the new invite appears in the pending table
      if (typeof window !== "undefined") {
        setTimeout(() => {
          window.location.reload();
        }, 800);
      }
    } catch (err) {
      console.error(err);
      setError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">
            Invite a teammate
          </h2>
          <p className="text-[11px] text-slate-500">
            Send an email invite so your team can access this workspace.
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_auto]">
        <div className="space-y-1.5">
          <label
            htmlFor="inviteEmail"
            className="block text-[11px] font-medium text-slate-700"
          >
            Work email
          </label>
          <input
            id="inviteEmail"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="teammate@company.com"
            className="block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
          />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="inviteRole"
            className="block text-[11px] font-medium text-slate-700"
          >
            Role
          </label>
          <select
            id="inviteRole"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none ring-0 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
          >
            {ROLE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end">
          <button
            type="submit"
            disabled={isSubmitting || !email}
            className="inline-flex w-full items-center justify-center rounded-full bg-[#172965] px-4 py-2 text-[11px] font-semibold text-white hover:bg-[#12204d] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Sending…" : "Send invite"}
          </button>
        </div>
      </div>

      {(error || success) && (
        <div className="text-[11px]">
          {error && (
            <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-rose-700">
              {error}
            </p>
          )}
          {success && (
            <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-emerald-700">
              {success}
            </p>
          )}
        </div>
      )}
    </form>
  );
}
