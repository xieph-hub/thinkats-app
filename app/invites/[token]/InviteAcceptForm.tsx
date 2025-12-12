// app/invites/[token]/InviteAcceptForm.tsx
"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type Props = {
  token: string;
  email: string;
  tenantName: string;
  role: string;
  isExpired: boolean;
  isUsed: boolean;
  accountExists: boolean;
};

export default function InviteAcceptForm({
  token,
  email,
  tenantName,
  role,
  isExpired,
  isUsed,
  accountExists,
}: Props) {
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ok, setOk] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const disabledReason = useMemo(() => {
    if (isUsed) return "This invitation link has already been used.";
    if (isExpired) return "This invitation link has expired.";
    return null;
  }, [isExpired, isUsed]);

  if (disabledReason) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm shadow-sm">
        <div className="text-slate-900 font-semibold">Invitation unavailable</div>
        <div className="mt-1 text-slate-600 text-xs">{disabledReason}</div>
        <div className="mt-4 text-xs text-slate-600">
          Please ask the workspace owner to send you a fresh invite.
        </div>
      </div>
    );
  }

  if (accountExists) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm shadow-sm">
        <div className="text-slate-900 font-semibold">Account already exists</div>
        <p className="mt-1 text-xs text-slate-600">
          The email <span className="font-semibold">{email}</span> already has a ThinkATS account.
          Please sign in to accept this invite.
        </p>

        <div className="mt-4 flex items-center gap-2">
          <Link
            href={`/login?redirect=${encodeURIComponent(`/invites/${token}`)}`}
            className="inline-flex items-center rounded-full bg-[#172965] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0f1c48]"
          >
            Sign in to continue
          </Link>

          <Link
            href="/contact"
            className="inline-flex items-center rounded-full bg-slate-50 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100"
          >
            Contact support
          </Link>
        </div>
      </div>
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!password || password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/invites/accept", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          token,
          fullName: fullName.trim() || null,
          password,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data?.ok) {
        setError(data?.error || "Failed to accept invitation.");
        setIsSubmitting(false);
        return;
      }

      setOk(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (ok) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm shadow-sm">
        <div className="font-semibold text-emerald-900">You’re all set</div>
        <p className="mt-1 text-xs text-emerald-800">
          Your account has been created and your access to{" "}
          <span className="font-semibold">{tenantName}</span> has been granted.
        </p>
        <div className="mt-4">
          <Link
            href={`/login?email=${encodeURIComponent(email)}`}
            className="inline-flex items-center rounded-full bg-[#172965] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0f1c48]"
          >
            Sign in to your workspace
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <div className="space-y-1">
        <div className="text-sm font-semibold text-slate-900">Create your account</div>
        <p className="text-xs text-slate-600">
          You’re accepting an invite as <span className="font-semibold">{role}</span> for{" "}
          <span className="font-semibold">{tenantName}</span>.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-1">
        <label className="text-xs font-medium text-slate-700">Email</label>
        <input
          value={email}
          readOnly
          className="block w-full rounded-md border border-slate-200 bg-slate-100 px-3 py-2 text-xs text-slate-700"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-slate-700">Full name (optional)</label>
        <input
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Jane Doe"
          className="block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-slate-700">Password</label>
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          placeholder="Minimum 8 characters"
          className="block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-slate-700">Confirm password</label>
        <input
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          type="password"
          placeholder="Re-enter password"
          className="block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex w-full items-center justify-center rounded-full bg-[#172965] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#0f1c48] disabled:opacity-60"
      >
        {isSubmitting ? "Accepting…" : "Accept invitation"}
      </button>

      <p className="text-[11px] text-slate-500">
        Security note: this is a single-use link sent to {email}.
      </p>
    </form>
  );
}
