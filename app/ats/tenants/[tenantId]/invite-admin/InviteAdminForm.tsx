// app/ats/tenants/[tenantId]/invite-admin/InviteAdminForm.tsx

import Link from "next/link";

type InviteAdminFormProps = {
  tenantId: string;
  tenantName: string;
  defaultEmail?: string | null;
};

export default function InviteAdminForm({
  tenantId,
  tenantName,
  defaultEmail,
}: InviteAdminFormProps) {
  const initialEmail = defaultEmail ?? "";

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
          Send a secure invite link so your client (or an internal owner) can
          log into this workspace with their own account.
        </p>
      </header>

      <form
        method="POST"
        action={`/api/ats/tenants/${tenantId}/invite-admin`}
        className="space-y-4 text-[13px]"
      >
        {/* Email */}
        <div className="space-y-1">
          <label
            htmlFor="email"
            className="text-xs font-medium text-slate-700"
          >
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
            This person will receive an invite email with a secure link to set
            up their login.
          </p>
        </div>

        {/* Full name */}
        <div className="space-y-1">
          <label
            htmlFor="fullName"
            className="text-xs font-medium text-slate-700"
          >
            Full name (optional)
          </label>
          <input
            id="fullName"
            name="fullName"
            type="text"
            placeholder="Jane Doe"
            className="block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
          />
          <p className="mt-1 text-[10px] text-slate-500">
            Used for a friendlier greeting in the invite email.
          </p>
        </div>

        {/* Role hint */}
        <div className="space-y-1">
          <label
            htmlFor="role"
            className="text-xs font-medium text-slate-700"
          >
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
            You can tweak permissions later; this sets their initial access
            level.
          </p>
        </div>

        {/* Optional message */}
        <div className="space-y-1">
          <label
            htmlFor="message"
            className="text-xs font-medium text-slate-700"
          >
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

        {/* Actions */}
        <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-4">
          <Link
            href="/ats/tenants"
            className="inline-flex items-center rounded-full bg-slate-50 px-4 py-1.5 text-[11px] font-medium text-slate-700 hover:bg-slate-100"
          >
            ← Back to workspaces
          </Link>

          <button
            type="submit"
            className="inline-flex items-center rounded-full bg-[#172965] px-4 py-1.5 text-[11px] font-semibold text-white shadow-sm hover:bg-[#0f1c48]"
          >
            Send admin invite
          </button>
        </div>
      </form>
    </div>
  );
}
