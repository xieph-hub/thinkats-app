// components/AuthRecoveryListener.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

type AuthRecoveryListenerProps = {
  /**
   * Where to send the user after a successful recovery / magic link.
   */
  redirectTo?: string;
};

export default function AuthRecoveryListener({
  redirectTo = "/ats",
}: AuthRecoveryListenerProps) {
  const router = useRouter();

  useEffect(() => {
    // Make sure we're on the client
    if (typeof window === "undefined") return;

    const url = new URL(window.location.href);
    const code = url.searchParams.get("code");
    const type = url.searchParams.get("type");

    // Only do anything if this is a magic-link / recovery hit
    if (!code || !type) return;

    (async () => {
      try {
        // Be flexible about Supabase client shape
        const authAny =
          (supabaseBrowser as any).auth ?? (supabaseBrowser as any);

        let error: unknown = null;

        // Supabase JS v2 – preferred path
        if (typeof authAny.exchangeCodeForSession === "function") {
          const { error: exchangeError } =
            await authAny.exchangeCodeForSession(code);
          error = exchangeError ?? null;
        }
        // Backwards-compatible fallback for older clients
        else if (typeof authAny.getSessionFromUrl === "function") {
          const { error: sessionError } = await authAny.getSessionFromUrl({
            storeSession: true,
          });
          error = sessionError ?? null;
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

        // Clean up query params so /auth/reset etc. don’t keep ?code=...
        url.searchParams.delete("code");
        url.searchParams.delete("type");
        window.history.replaceState({}, "", url.toString());

        // Move the user into the ATS
        router.replace(redirectTo);
      } catch (err) {
        console.error("Unexpected error in AuthRecoveryListener", err);
      }
    })();
  }, [redirectTo, router]);

  return null;
}
