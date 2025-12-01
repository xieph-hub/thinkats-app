// app/login/page.tsx
import type { Metadata } from "next";
import LoginForm from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Sign in | ThinkATS",
  description: "Sign in with your work email to access ThinkATS.",
};

type LoginPageProps = {
  searchParams?: {
    redirectTo?: string;
    workspace?: string;
  };
};

export default function LoginPage({ searchParams }: LoginPageProps) {
  const redirectTo = searchParams?.redirectTo || "/ats";
  const initialWorkspace = searchParams?.workspace || "";

  return (
    <main className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <LoginForm
          redirectTo={redirectTo}
          initialWorkspace={initialWorkspace}
        />
      </div>
    </main>
  );
}
