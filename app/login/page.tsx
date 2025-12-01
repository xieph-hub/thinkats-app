// app/login/page.tsx
import type { Metadata } from "next";
import LoginForm from "@/components/auth/LoginForm";
import LoginRedirectWatcher from "@/components/auth/LoginRedirectWatcher";

export const metadata: Metadata = {
  title: "Log in | ThinkATS",
  description: "Log in with your work email to access your ThinkATS workspace.",
};

type LoginPageProps = {
  searchParams?: { [key: string]: string | string[] | undefined };
};

function getFirst(param: string | string[] | undefined): string | undefined {
  if (Array.isArray(param)) return param[0];
  return param;
}

export default function LoginPage({ searchParams }: LoginPageProps) {
  const redirectTo = getFirst(searchParams?.redirectTo) || "/ats";
  const initialWorkspace = getFirst(searchParams?.workspace) || "";

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-slate-950">
      <div className="mx-auto flex max-w-6xl flex-col gap-12 px-4 py-12 lg:flex-row lg:items-center">
        <section className="flex-1 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-400">
            ThinkATS
          </p>
          <h1 className="text-3xl sm:text-4xl font-semibold text-white">
            Log in to your hiring workspace.
          </h1>
          <p className="text-sm sm:text-base text-slate-300 max-w-md">
            Access your pipelines, automations and analytics in one place.
            Use the same work email you used when your workspace was created.
          </p>
        </section>

        <section className="flex-1 flex justify-center">
          {/* This will kick you out of /login as soon as a session exists */}
          <LoginRedirectWatcher redirectTo={redirectTo} />

          <LoginForm
            redirectTo={redirectTo}
            initialWorkspace={initialWorkspace}
          />
        </section>
      </div>
    </main>
  );
}
