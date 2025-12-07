// app/ats/tenants/[tenantId]/users/PendingInvitesTable.tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type InviteRow = {
  id: string;
  email: string;
  role: string;
  createdAt: string;
  expiresAt: string | null;
  usedAt: string | null;
  tokenHash: string;
};

type Props = {
  tenantId: string;
  invites: InviteRow[];
};

function formatDateTime(value: string | null): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function roleLabel(raw: string | null | undefined): string {
  if (!raw) return "Member";
  const r = raw.toLowerCase();
  if (r === "owner") return "Owner";
  if (r === "admin") return "Admin";
  if (r === "recruiter") return "Recruiter";
  if (r === "hiring_manager") return "Hiring manager";
  return r.charAt(0).toUpperCase() + r.slice(1);
}

function roleBadgeClasses(raw: string | null | undefined): string {
  if (!raw) return "bg-slate-50 text-slate-700 ring-slate-200";
  const r = raw.toLowerCase();
  switch (r) {
    case "owner":
      return "bg-[#172965]/10 text-[#172965] ring-[#172965]/20";
    case "admin":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";
    case "recruiter":
      return "bg-[#FFC000]/10 text-[#8a6400] ring-[#FFC000]/30";
    case "hiring_manager":
      return "bg-sky-50 text-sky-700 ring-sky-200";
    default:
      return "bg-slate-50 text-slate-700 ring-slate-200";
  }
}

function buildInviteUrl(invite: InviteRow, tenantId: string): string {
  const envBase = process.env.NEXT_PUBLIC_SITE_URL;
  const origin =
    typeof window !== "undefined" ? window.location.origin : undefined;

  const baseUrl = envBase || origin || "https://www.thinkats.com";

  return `${baseUrl}/login?inviteToken=${encodeURIComponent(
    invite.tokenHash,
  )}&tenantId=${encodeURIComponent(tenantId)}`;
}

export default function PendingInvitesTable({ tenantId, invites }: Props) {
  const router = useRouter();

  const [copyState, setCopyState] = useState<{
    id: string | null;
    status: "idle" | "copied" | "error";
  }>({ id: null, status: "idle" });

  const [resendState, setResendState] = useState<{
    id: string | null;
    status: "idle" | "sending" | "success" | "error";
  }>({ id: null, status: "idle" });

  async function handleCopy(invite: InviteRow) {
    try {
      const url = buildInviteUrl(invite, tenantId);
      await navigator.clipboard.writeText(url);
      setCopyState({ id: invite.id, status: "copied" });
      setTimeout(
        () => setCopyState({ id: null, status: "idle" }),
        1500,
      );
    } catch (err) {
      console.error("Copy invite link error", err);
      setCopyState({ id: invite.id, status: "error" });
    }
  }

  async function handleResend(invite: InviteRow) {
    try {
      setResendState({ id: invite.id, status: "sending" });

      const res = await fetch(
        `/api/ats/tenants/${tenantId}/users/resend-invite`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ invitationId: invite.id }),
        },
      );

      const json = await res.json().catch(() => ({}));

      if (!res.ok || !json?.ok) {
        setResendState({ id: invite.id, status: "error" });
        return;
      }

      setResendState({ id: invite.id, status: "success" });
      router.refresh();
    } catch (err) {
      console.error("Resend invite error", err);
      setResendState({ id: invite.id, status: "error" });
    }
  }

  if (invites.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 py-8 text-center text-[11px] text-slate-500">
        <p className="mb-1 font-medium text-slate-700">
          No invitations yet.
        </p>
        <p>
          Use the invite form above to send workspace access links to your
          admins and hiring managers.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-100">
      <table className="min-w-full border-collapse text-left text-[11px]">
        <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-3 py-2">Email</th>
            <th className="px-3 py-2">Role</th>
            <th className="px-3 py-2">Status</th>
            <th className="px-3 py-2">Sent</th>
            <th className="px-3 py-2">Expires</th>
            <th className="px-3 py-2 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {invites.map((inv) => {
            const isUsed = Boolean(inv.usedAt);
            const isExpired =
              !isUsed &&
              inv.expiresAt &&
              new Date(inv.expiresAt) < new Date();

            const isCopyActive =
              copyState.id === inv.id && copyState.status === "copied";
            const isCopyError =
              copyState.id === inv.id && copyState.status === "error";

            const isResendSending =
              resendState.id === inv.id && resendState.status === "sending";
            const isResendError =
              resendState.id === inv.id && resendState.status === "error";
            const isResendSuccess =
              resendState.id === inv.id && resendState.status === "success";

            return (
              <tr key={inv.id}>
                <td className="px-3 py-2 align-middle text-slate-800">
                  {inv.email}
                </td>
                <td className="px-3 py-2 align-middle">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ${roleBadgeClasses(
                      inv.role,
                    )}`}
                  >
                    {roleLabel(inv.role)}
                  </span>
                </td>
                <td className="px-3 py-2 align-middle">
                  {isUsed ? (
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 ring-1 ring-emerald-200">
                      Accepted
                    </span>
                  ) : isExpired ? (
                    <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-medium text-rose-700 ring-1 ring-rose-200">
                      Expired
                    </span>
                  ) : (
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700 ring-1 ring-amber-200">
                      Pending
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 align-middle text-slate-500">
                  {formatDateTime(inv.createdAt)}
                </td>
                <td className="px-3 py-2 align-middle text-slate-500">
                  {inv.expiresAt ? formatDateTime(inv.expiresAt) : "—"}
                </td>
                <td className="px-3 py-2 align-middle">
                  {isUsed ? (
                    <span className="text-[10px] text-slate-400">
                      Accepted
                    </span>
                  ) : (
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleCopy(inv)}
                        className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-700 hover:bg-slate-100"
                      >
                        {isCopyActive
                          ? "Copied"
                          : isCopyError
                          ? "Error"
                          : "Copy link"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleResend(inv)}
                        disabled={isResendSending}
                        className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isResendSending
                          ? "Sending…"
                          : isResendSuccess
                          ? "Re-sent"
                          : isResendError
                          ? "Failed"
                          : "Resend"}
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
