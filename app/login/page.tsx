// app/login/page.tsx
import type { Metadata } from "next";
import LoginPageClient from "./LoginPageClient";

export const metadata: Metadata = {
  title: "ThinkATS | Login",
  description: "Sign in to manage ATS workspaces, jobs and candidates.",
};

type SearchParams = {
  reset?: string;
  error?: string;
};

export default function LoginPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const reset = searchParams?.reset === "1";
  const errorCode = searchParams?.error ?? null;

  return <LoginPageClient reset={reset} errorCode={errorCode} />;
}
