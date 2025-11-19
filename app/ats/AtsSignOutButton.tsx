// app/ats/AtsSignOutButton.tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AtsSignOutButton() {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    if (isSigningOut) return;

    setIsSigningOut(true);
    try {
      const res = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (!res.ok) {
        // Optional: you could show a toast / error message here
        console.error("Logout failed");
      }
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      // Whether or not the request failed, push them out of ATS
      setIsSigningOut(false);
      router.push("/login?role=client");
      router.refresh();
    }
  };

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={isSigningOut}
      className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {isSigningOut ? "Signing out..." : "Sign out"}
    </button>
  );
}
