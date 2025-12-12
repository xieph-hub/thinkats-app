// app/ats/tenants/[tenantId]/invite-admin/InviteAdminForm.tsx
"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type InviteAdminFormProps = {
  tenantId: string; // can be UUID or slug
  tenantName: string;
  defaultEmail?: string | null;
};

type ApiOk = {
  ok: true;
  emailStatus: "sent" | "failed" | "skipped";
  inviteUrl: string;
  emailErrorHint?: string;
};

type ApiErr = {
  ok: false;
  error: string;
};

export default function InviteAdminForm({
  tenantId,
  tenantName,
  defaultEmail,
}: InviteAdminFormProps) {
  const initialEmail = useMemo(() => defaultEmail ?? "", [defaultEmail]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<ApiOk | ApiErr | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCopied(false);
    setResult(null);
    setIsSubmitting(true);

    try {
      const form = e.currentTarget;
      const formData = new FormData(form);

      const res = await fetch(`/api/ats/tenants/${tenantId}/invite-admin`, {
        method: "POST",
        body: formData,
        headers: { Accept: "application/json" },
      });

      const data = (await res.json().catch(() => null)) as ApiOk | ApiErr | null;

      if (!res.ok || !data) {
        setResult({ ok: false, error: "server_error" });
        return;
      }

      setResult(data);

      if (data.ok) {
        // keep email input as-is (nice UX) but clear optional fields
        const fullName = form.querySelector<HTMLInputElement>('input[name="fullName"]');
        const message = form.querySelector<HTMLTextAreaElement>('textarea[name="message"]');
        const role = form.querySelector<HTMLSelectElement>('select[name="role"]');

        if (fullName) fullName.value = "";
        if (message) message.value = "";
        if (role) role.value = "admin";
      }
    } catch (err: any) {
      setResult({ ok: false, error: err?.message || "network_error" });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function copyInviteLink() {
    if (!result || !result.ok) return;
    try {
      await navigator.clipboard.writeText(result.inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <header className="space-y-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          ATS · Tenant admin invite
        </p>
        <h1 className="text-lg font-semibold text-slate-900">
          Invite an admin to <span className="text-[#172965]">{tenantName}</span>
        </h1>
        <p className="text-xs text-slate-600">
          Send a secure invite link so your client (or an internal owner) can log into this workspace with
          their own account.
        </p>
      </header>

      {result?.ok === true && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-[12px] text-emerald-900">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="font-semibold">Invite created.</div>
              <div className="text-[11px] text-emerald-800">
                Email status:{" "}
                <span className="font-semibold">
                  {result.emailStatus.toUpperCase()}
                </span>
                {result.emailStatus !== "sent" && result.emailErrorHint ? (
                  <span className="ml-2 text-emerald-800/80">
                    ({result.emailErrorHint})
                  </span>
                ) : null}
              </div>
            </div>

            <button
              type="button"
              onClick={copyInviteLink}
              className="inline-flex items-center rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold text-emerald-900 shadow-sm ring-1 ring-emerald-200 hover:bg-emerald-100"
            >
              {copied ? "Copied ✓" : "Copy invite link"}
            </button>
          </div>

          <div className="mt-2 break-all rounded-lg bg-white/70 p-2 text-[11px] text-emerald-950 ring-1 ring-emerald-200">
            {result.inviteUrl}
          </div>
        </div>
      )}

      {result?.ok === false && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-[12px] text-rose-900">
          <div className="font-semibold">Invite failed.</div>
          <div className="text-[11px] text-rose-800">Reason: {result.error}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 text-[13px]">
        {/* Email */}
        <div className="space-y-1">
          <label htmlFor="email" className="text-xs font-medium text-slate-700">
            Admin email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            defaultValue={initialEmail}
            placeholder="founder@client.com"
            className="block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
          />
          <p className="mt-1 text-[10px] text-slate-500">
            This person will receive an invite email with a secure link to set up their login.
          </p>
        </div>

        {/* Full name */}
        <div className="space-y-1">
          <label htmlFor="fullName" className="text-xs font-medium text-slate-700">
            Full name (optional)
          </label>
          <input
            id="fullName"
            name="fullName"
            type="text"
            placeholder="Jane Doe"
            className="block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
          />
          <p className="mt-1 text-[10px] text-slate-500">Used for a friendlier greeting in the invite email.</p>
        </div>

        {/* Role */}
        <div className="space-y-1">
          <label htmlFor="role" className="text-xs font-medium text-slate-700">
            Role in this workspace
          </label>
          <select
            id="role"
            name="role"
            defaultValue="admin"
            className="block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none ring-0 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
          >
            <option value="owner">Owner</option>
            <option value="admin">Admin</option>
            <option value="recruiter">Recruiter</option>
            <option value="viewer">Viewer</option>
          </select>
          <p className="mt-1 text-[10px] text-slate-500">
            You can tweak permissions later; this sets their initial access level.
          </p>
        </div>

        {/* Message */}
        <div className="space-y-1">
          <label htmlFor="message" className="text-xs font-medium text-slate-700">
            Personal message (optional)
          </label>
          <textarea
            id="message"
            name="message"
            rows={3}
            placeholder={`Hi, I'm inviting you to manage hiring for ${tenantName} on ThinkATS.`}
            className="block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
          />
          <p className="mt-1 text-[10px] text-slate-500">
            This appears in the body of the invite email under the main copy.
          </p>
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-4">
          <Link
            href="/ats/tenants"
            className="inline-flex items-center rounded-full bg-slate-50 px-4 py-1.5 text-[11px] font-medium text-slate-700 hover:bg-slate-100"
          >
            ← Back to workspaces
          </Link>

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center rounded-full bg-[#172965] px-4 py-1.5 text-[11px] font-semibold text-white shadow-sm hover:bg-[#0f1c48] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "Sending…" : "Send admin invite"}
          </button>
        </div>
      </form>
    </div>
  );
}
