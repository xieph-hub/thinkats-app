// app/AuthHashRedirector.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AuthHashRedirector() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const { pathname, hash } = window.location;

    // Only care about the root page
    if (pathname !== "/" || !hash || !hash.startsWith("#")) return;

    const params = new URLSearchParams(hash.slice(1));
    const type = params.get("type");

    // Only intercept password recovery links
    if (type === "recovery") {
      // Preserve the full hash so /auth/reset can parse it
      router.replace("/auth/reset" + hash);
    }
  }, [router]);

  return null;
}
