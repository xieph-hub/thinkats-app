"use client";

import { useMemo, useState } from "react";

type Props = {
  token: string;
  tenantName: string;
  invitedEmail: string;
  role: string;
  expiresAt: string;
  mode: "create" | "signin";
};

export default function InviteAcceptClient({
  token,
  tenantName,
  invitedEmail,
  role,
  expiresAt,
  mode,
}: Props) {
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const expiryLabel = useMemo(() => {
    try {
      const d = new Date(expiresAt);
      return d.toLocaleString();
    } catch {
      return "Soon";
    }
  }, [expiresAt]);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 10) {
      setError("Use a stronger password (minimum 10 characters).");
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
        setError(
          data?.error === "account_exists"
            ? "This email already has an account. Please sign in."
            : data?.error || "Failed to accept invitation.",
        );
        return;
      }

      // Redirect to login with email prefilled
      window.location.href =
        data?.next || `/login?email=${encodeURIComponent(invitedEmail)}`;
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          ThinkATS · Invitation
        </p>

        <h1 className="mt-2 text-lg font-semibold text-slate-900">
          {mode === "create" ? "Create your account" : "Sign in to accept"}
        </h1>

        <p className="mt-2 text-sm text-slate-600">
          You’ve been invited to <span className="font-semibold">{tenantName}</span>{" "}
          as <span className="font-semibold">{role}</span>.
        </p>

        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
          <div className="flex items-center justify-between gap-3">
            <span className="text-slate-500">Email</span>
            <span className="font-semibold text-slate-900">{invitedEmail}</span>
          </div>
          <div className="mt-2 flex items-center justify-between gap-3">
            <span className="text-slate-500">Expires</span>
            <span className="font-semibold text-slate-900">{expiryLabel}</span>
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">
            {error}
          </div>
        )}

        {mode === "signin" ? (
          <div className="mt-5 space-y-3">
            <p className="text-sm text-slate-600">
              This email already has a ThinkATS account. Please sign in to continue.
            </p>
            <a
              href={`/login?email=${encodeURIComponent(invitedEmail)}`}
              className="inline-flex w-full items-center justify-center rounded-full bg-[#172965] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0f1c48]"
            >
              Continue to sign in
            </a>
            <p className="text-[11px] text-slate-500">
              Security note: invitations are single-use and can’t be used to reset passwords.
            </p>
          </div>
        ) : (
          <form className="mt-5 space-y-4" onSubmit={onCreate}>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">
                Full name (optional)
              </label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Ada Lovelace"
                className="block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">
                Create password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 10 characters"
                className="block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">
                Confirm password
              </label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
              />
            </div>

            <button
              disabled={isSubmitting}
              type="submit"
              className="inline-flex w-full items-center justify-center rounded-full bg-[#172965] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0f1c48] disabled:opacity-60"
            >
              {isSubmitting ? "Creating account…" : "Create account & continue"}
            </button>

            <p className="text-[11px] text-slate-500">
              Security note: This invite is single-use and tied to {invitedEmail}.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
