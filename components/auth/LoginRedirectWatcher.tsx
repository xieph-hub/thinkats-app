// components/auth/LoginRedirectWatcher.tsx
"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

export default function LoginRedirectWatcher({
  redirectTo = "/ats",
}: {
  redirectTo?: string;
}) {
  const router = useRouter();
  const hasRedirected = useRef(false);

  useEffect(() => {
    let mounted = true;

    async function checkInitialSession() {
      try {
        const { data, error } = await supabaseBrowser.auth.getSession();
        if (!mounted || hasRedirected.current) return;
        if (error) {
          console.error("Error checking session on /login:", error);
          return;
        }
        if (data?.session) {
          hasRedirected.current = true;
          router.replace(redirectTo);
        }
      } catch (err) {
        console.error("Unexpected session check error:", err);
      }
    }

    checkInitialSession();

    const {
      data: { subscription },
    } = supabaseBrowser.auth.onAuthStateChange((_event, session) => {
      if (!mounted || hasRedirected.current) return;
      if (session) {
        hasRedirected.current = true;
        router.replace(redirectTo);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [redirectTo, router]);

  return null;
}
