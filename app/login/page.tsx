// app/login/page.tsx
import type { Metadata } from "next";
import { Suspense } from "react";
import LoginPageClient from "./LoginPageClient";

export const metadata: Metadata = {
  title: "Sign in | ThinkATS",
  description: "Sign in to your ThinkATS workspace.",
};

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center px-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
              <div className="mt-4 h-8 w-3/4 animate-pulse rounded bg-slate-200" />
              <div className="mt-6 space-y-3">
                <div className="h-9 w-full animate-pulse rounded bg-slate-200" />
                <div className="h-9 w-full animate-pulse rounded bg-slate-200" />
                <div className="h-9 w-full animate-pulse rounded bg-slate-200" />
              </div>
            </div>
          </div>
        }
      >
        <LoginPageClient />
      </Suspense>
    </main>
  );
}
