// app/ats/verify/page.tsx
import type { Metadata } from "next";
import VerifyOtpPageClient from "./VerifyOtpPageClient";

export const metadata: Metadata = {
  title: "ThinkATS | Verify access",
  description: "Enter your one-time code to access the ATS workspace.",
};

export default function VerifyOtpPage() {
  return <VerifyOtpPageClient />;
}
