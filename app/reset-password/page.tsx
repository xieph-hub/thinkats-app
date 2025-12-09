// app/reset-password/page.tsx
import type { Metadata } from "next";
import ResetPasswordPageClient from "./ResetPasswordPageClient";

export const metadata: Metadata = {
  title: "ThinkATS | Reset password",
  description: "Set a new password for your ThinkATS account.",
};

type SearchParams = {
  email?: string;
  code?: string;
};

export default function ResetPasswordPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const email = searchParams?.email ?? "";
  const code = searchParams?.code ?? "";

  return <ResetPasswordPageClient initialEmail={email} initialCode={code} />;
}
