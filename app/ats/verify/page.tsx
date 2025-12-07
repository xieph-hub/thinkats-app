// app/ats/verify/page.tsx
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerUser } from "@/lib/auth/getServerUser"; // 👈 use the new helper
import VerifyOtpClient from "./VerifyOtpClient";

export const metadata: Metadata = {
  title: "Verify login | ThinkATS",
  description:
    "Enter the one-time code sent to your email to access ThinkATS.",
};

export default async function AtsVerifyPage() {
  // getServerUser now returns a context object:
  // { supabaseUser, user, isSuperAdmin, primaryTenant, tenant }
  const { supabaseUser } = await getServerUser();

  // If there is no Supabase user or no email, treat as unauthenticated
  if (!supabaseUser || !supabaseUser.email) {
    redirect("/login?callbackUrl=/ats");
  }

  const email: string = supabaseUser.email ?? "";

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-lg font-semibold text-slate-900">
          Verify your login
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          We&apos;ve sent a one-time code to{" "}
          <span className="font-medium text-slate-900">
            {maskEmail(email)}
          </span>
          . Enter the 6-digit code below to open your ATS workspace.
        </p>

        <VerifyOtpClient />
      </div>
    </div>
  );
}

function maskEmail(email: string): string {
  if (!email.includes("@")) return email;
  const [local, domain] = email.split("@");
  if (local.length <= 2) return `***@${domain}`;
  return `${local.slice(0, 2)}***@${domain}`;
}
