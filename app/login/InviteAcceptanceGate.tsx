"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function InviteAcceptanceGate() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("inviteToken");
  const tenantId = searchParams.get("tenantId");
  const [hasAccepted, setHasAccepted] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  const supabase = createClientComponentClient();

  useEffect(() => {
    // No invite on URL, nothing to do
    if (!inviteToken || hasAccepted || isRunning) return;

    const run = async () => {
      // Wait until user is actually logged in
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        // Not logged in yet – we will try again on the next render
        return;
      }

      setIsRunning(true);
      try {
        const res = await fetch("/api/auth/invitations/accept", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            inviteToken,
            tenantId,
          }),
        });

        const payload = await res.json();

        if (!res.ok || !payload.ok) {
          console.error("Invite acceptance failed:", payload);
          setIsRunning(false);
          return;
        }

        setHasAccepted(true);

        if (payload.redirectTo) {
          router.replace(payload.redirectTo);
        } else if (payload.tenantId) {
          router.replace(`/ats?tenantId=${encodeURIComponent(payload.tenantId)}`);
        } else {
          router.replace("/ats");
        }
      } catch (err) {
        console.error("Error calling invite acceptance API:", err);
      } finally {
        setIsRunning(false);
      }
    };

    run();
  }, [inviteToken, tenantId, hasAccepted, isRunning, supabase, router]);

  return null;
}
