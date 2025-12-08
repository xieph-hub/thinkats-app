// app/login/page.tsx
import type { Metadata } from "next";
import LoginPageClient from "./LoginPageClient";

export const metadata: Metadata = {
  title: "Sign in | ThinkATS",
  description: "Sign in to your ThinkATS workspace.",
};

type PageProps = {
  searchParams?: { callbackUrl?: string };
};

export default function LoginPage({ searchParams }: PageProps) {
  const rawCallback = searchParams?.callbackUrl;

  // Only allow internal callback paths, default to /ats
  const callbackUrl =
    rawCallback && rawCallback.startsWith("/") ? rawCallback : "/ats";

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-4 py-10 sm:py-14 lg:px-10">
        <LoginPageClient callbackUrl={callbackUrl} />
      </div>
    </main>
  );
}
