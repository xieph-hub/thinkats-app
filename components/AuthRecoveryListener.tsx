// components/AuthRecoveryListener.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

export default function AuthRecoveryListener() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const hash = window.location.hash;
    if (!hash || !hash.includes("type=recovery")) {
      return;
    }

    (async () => {
      // This reads the tokens from the URL fragment and stores the session
      const { error } = await supabaseBrowser.auth.getSessionFromUrl({
        storeSession: true,
      });

      if (error) {
        console.error("Error completing recovery:", error);
        // You could show a toast or route to an error page if you want.
        return;
      }

      // Once the session is set, send the user to the reset form
      router.replace("/auth/reset");
    })();
  }, [router]);

  return null;
}
