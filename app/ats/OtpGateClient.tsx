// app/ats/OtpGateClient.tsx
"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

type AuthMeResponse = {
  ok: boolean;
  email: string | null;
  isSuperAdmin: boolean;
  isOtpVerified: boolean;
};

type Props = {
  children: ReactNode;
};

export default function OtpGateClient({ children }: Props) {
  const router = useRouter();
  const pathname = usePathname() || "/ats";
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function checkAuth() {
      try {
        const res = await fetch("/api/ats/auth/me", {
          method: "GET",
          cache: "no-store",
        });

        const data: AuthMeResponse = await res.json().catch(() => ({
          ok: false,
          email: null,
          isSuperAdmin: false,
          isOtpVerified: false,
        }));

        const currentPath = pathname || "/ats";
        const callbackUrl = currentPath.startsWith("/ats")
          ? currentPath
          : "/ats";

        // Not logged in → kick to /login
        if (!data.ok || !data.email) {
          if (!cancelled) {
            router.push(
              `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`,
            );
          }
          return;
        }

        // Logged in but OTP not verified → send to /ats/verify
        if (
          !data.isOtpVerified &&
          !currentPath.startsWith("/ats/verify")
        ) {
          if (!cancelled) {
            router.push(
              `/ats/verify?callbackUrl=${encodeURIComponent(
                callbackUrl,
              )}`,
            );
          }
          return;
        }

        if (!cancelled) {
          setChecked(true);
        }
      } catch (err) {
        console.error("OtpGateClient auth check error:", err);
        const callbackUrl = pathname.startsWith("/ats")
          ? pathname
          : "/ats";
        if (!cancelled) {
          router.push(
            `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`,
          );
        }
      }
    }

    checkAuth();

    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  // For non-/ats/verify pages, show a small loader while we check.
  if (!checked && !pathname.startsWith("/ats/verify")) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 px-4 py-3 text-xs text-slate-400">
          Checking your access…
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
