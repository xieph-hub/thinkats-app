// app/login/page.tsx
import type { Metadata } from "next";
import LoginForm from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Log in | ThinkATS",
  description:
    "Log in to your ThinkATS hiring workspace to manage pipelines, automations and analytics.",
};

type LoginPageProps = {
  searchParams?: {
    callbackUrl?: string;
  };
};

export default function LoginPage({ searchParams }: LoginPageProps) {
  const callbackUrl = searchParams?.callbackUrl ?? "/ats";

  return (
    <main className="bg-slate-950 text-slate-50">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl flex-col gap-12 px-6 py-16 md:flex-row md:items-center md:gap-16">
        {/* Left copy */}
        <section className="flex-1">
          <p className="text-[11px] font-semibold tracking-[0.3em] text-sky-400">
            THINKATS
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
            Log in to your hiring workspace.
          </h1>
          <p className="mt-4 max-w-md text-sm text-slate-300">
            Access your pipelines, automations and analytics in one place. Use
            the same work email you used when your workspace was created.
          </p>
        </section>

        {/* Right side – form */}
        <section className="flex-1">
          <LoginForm callbackUrl={callbackUrl} />
        </section>
      </div>
    </main>
  );
}
