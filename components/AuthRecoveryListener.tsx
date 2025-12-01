// components/AuthRecoveryListener.tsx
"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

type AuthRecoveryListenerProps = {
  /**
   * Where to send the user after a successful recovery / magic link.
   * Adjust this to whatever route makes sense for ThinkATS.
   */
  redirectTo?: string;
};

export default function AuthRecoveryListener({
  redirectTo = "/ats",
}: AuthRecoveryListenerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Supabase recovery / magic links hit your app with ?code=...&type=recovery
    const code = searchParams.get("code");
    const type = searchParams.get("type");

    if (!code || !type) return;

    (async () => {
      try {
        const url = window.location.href;
        const authAny = supabaseBrowser.auth as any;

        let error: unknown = null;

        // Supabase JS v2: use exchangeCodeForSession
        if (typeof authAny.exchangeCodeForSession === "function") {
          const result = await authAny.exchangeCodeForSession(url);
          error = result?.error ?? null;
        }
        // Fallback for older client versions (if you ever downgrade)
        else if (typeof authAny.getSessionFromUrl === "function") {
          const result = await authAny.getSessionFromUrl({
            storeSession: true,
          });
          error = result?.error ?? null;
        } else {
          console.error(
            "No compatible Supabase auth method found (exchangeCodeForSession / getSessionFromUrl)."
          );
          return;
        }

        if (error) {
          console.error("Error exchanging code for session", error);
          return;
        }

        // Strip the code/type query params from the URL and move user on
        router.replace(redirectTo);
      } catch (err) {
        console.error("Unexpected error in AuthRecoveryListener", err);
      }
    })();
  }, [redirectTo, router, searchParams]);

  return null;
}
