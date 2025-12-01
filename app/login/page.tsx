// app/login/page.tsx
import type { Metadata } from "next";
import { Suspense } from "react";
import LoginPageClient from "./LoginPageClient";

export const metadata: Metadata = {
  title: "Login | ThinkATS",
  description:
    "Login to ThinkATS to access your ATS workspace, roles, candidates and pipelines.",
};

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center text-sm text-slate-500">
          Loading login…
        </div>
      }
    >
      <LoginPageClient />
    </Suspense>
  );
}
