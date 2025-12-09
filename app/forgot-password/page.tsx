// app/forgot-password/page.tsx
import type { Metadata } from "next";
import ForgotPasswordPageClient from "./ForgotPasswordPageClient";

export const metadata: Metadata = {
  title: "ThinkATS | Forgot password",
  description: "Request a password reset for your ThinkATS account.",
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordPageClient />;
}
