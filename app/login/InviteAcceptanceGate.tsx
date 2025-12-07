// app/login/InviteAcceptanceGate.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

type Status =
  | "idle"
  | "checking_auth"
  | "accepting"
  | "skipped"
  | "error";

export default function InviteAcceptanceGate() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("inviteToken");
  const tenantId = searchParams.get("tenantId");

  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    // Only run once per mount when we actually have an invite in the URL
    if (!inviteToken || !tenantId || status !== "idle") {
      return;
    }

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    async function run() {
      try {
        setStatus("checking_auth");

        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        // Not signed in yet – show a hint and wait for login
        if (authError || !user || !user.email) {
          setStatus("skipped");
          return;
        }

        setStatus("accepting");

        const res = await fetch("/api/ats/invitations/accept", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ inviteToken, tenantId }),
        });

        const json = (await res.json().catch(() => ({}))) as any;

        if (!res.ok || !json?.ok) {
          const code = json?.error as string | undefined;
          let friendly = "We couldn’t accept your invitation.";

          if (code === "invalid_or_expired_invite") {
            friendly = "This invitation link is invalid or has expired.";
          } else if (code === "tenant_mismatch") {
            friendly = "This invite doesn’t match the current workspace.";
          } else if (code === "email_mismatch") {
            friendly =
              "You’re signed in with a different email than the one invited.";
          } else if (code === "unauthenticated") {
            friendly = "Please sign in first, then open the invite link again.";
          }

          setErrorMessage(friendly);
          setStatus("error");
          return;
        }

        const redirectTo: string =
          typeof json.redirectTo === "string"
            ? json.redirectTo
            : `/ats/tenants/${tenantId}/jobs`;

        router.replace(redirectTo);
      } catch (err) {
        console.error("InviteAcceptanceGate error", err);
        setErrorMessage("Unexpected error while accepting your invitation.");
        setStatus("error");
      }
    }

    void run();
  }, [inviteToken, tenantId, status, router]);

  // No invite in URL → no-op
  if (!inviteToken || !tenantId) {
    return null;
  }

  if (status === "checking_auth" || status === "accepting") {
    return (
      <div className="mb-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-600">
        Connecting your account to the invited workspace…
      </div>
    );
  }

  if (status === "skipped") {
    return (
      <div className="mb-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-600">
        You&apos;ve been invited to a workspace. Sign in to link it to your
        account.
      </div>
    );
  }

  if (status === "error" && errorMessage) {
    return (
      <div className="mb-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] text-rose-700">
        {errorMessage}
      </div>
    );
  }

  return null;
}
