// app/ats/jobs/new/page.tsx
import type { Metadata } from "next";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { JobPublishingForm } from "@/components/ats/JobPublishingForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "New role | Resourcin ATS",
  description:
    "Create and publish a new mandate managed by Resourcin and its clients.",
};

type ClientCompany = {
  id: string;
  name: string;
  logo_url: string | null;
  slug: string | null;
};

export default async function NewJobPage() {
  const { data: clientCompanies, error } = await supabaseAdmin
    .from("client_companies")
    .select("id, name, logo_url, slug")
    .order("name", { ascending: true });

  if (error) {
    console.error("ATS new job – failed to load client companies:", error);
  }

  // 🔴 IMPORTANT:
  // Replace this with however you actually resolve tenant in your app
  // (session, slug, etc.). For now we keep the known default.
  const TENANT_ID =
    process.env.NEXT_PUBLIC_TENANT_ID ?? "tenant_resourcin_1";

  return (
    <JobPublishingForm
      tenantId={TENANT_ID}
      clients={(clientCompanies ?? []) as ClientCompany[]}
    />
  );
}
