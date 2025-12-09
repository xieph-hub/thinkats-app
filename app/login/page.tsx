// app/login/page.tsx
import type { Metadata } from "next";
import { Suspense } from "react";
import LoginPageClient from "./LoginPageClient";

export const metadata: Metadata = {
  title: "Sign in | ThinkATS",
  description:
    "Sign in to ThinkATS to manage workspaces, jobs, candidates and clients.",
};

// Optional: if you *never* want this statically generated, you can uncomment:
// export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50 text-xs text-slate-500">
          Loading sign-in…
        </div>
      }
    >
      <LoginPageClient />
    </Suspense>
  );
}
