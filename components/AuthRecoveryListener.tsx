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
      const { error } = await supabaseBrowser.auth.getSessionFromUrl({
        storeSession: true,
      });

      if (error) {
        console.error("Error completing recovery:", error);
        return;
      }

      router.replace("/auth/reset");
    })();
  }, [router]);

  return null;
}
