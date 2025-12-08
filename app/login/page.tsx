// app/login/page.tsx
import type { Metadata } from "next";
import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: "ThinkATS | Admin Login",
  description: "Sign in to your ThinkATS admin workspace.",
};

type LoginPageProps = {
  searchParams?: {
    callbackUrl?: string;
  };
};

export default function LoginPage({ searchParams }: LoginPageProps) {
  const callbackUrl = searchParams?.callbackUrl || "/ats";

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="w-full max-w-md rounded-2xl bg-slate-900/80 border border-slate-800 px-6 py-8 shadow-xl">
        <div className="mb-6 text-center space-y-2">
          <h1 className="text-xl font-semibold text-slate-50">
            ThinkATS Admin
          </h1>
          <p className="text-sm text-slate-400">
            Sign in with your official work email to access the ATS workspace.
          </p>
        </div>

        <LoginForm callbackUrl={callbackUrl} />

        <p className="mt-6 text-center text-xs text-slate-500">
          Having trouble? Contact{" "}
          <a
            href="mailto:support@thinkats.com"
            className="underline underline-offset-4"
          >
            support@thinkats.com
          </a>
          .
        </p>
      </div>
    </div>
  );
}
