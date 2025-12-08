// app/ats/jobs/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getResourcinTenant, requireTenantMembership } from "@/lib/tenant"; // 👈 UPDATED
import AtsJobsTable, { AtsJobRow } from "./AtsJobsTable";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ThinkATS | Jobs",
  description:
    "Workspace-wide view of open and draft roles, with bulk actions and publishing controls.",
};

type JobsPageSearchParams = {
  q?: string | string[];
  status?: string | string[];
  clientId?: string | string[];
  function?: string | string[];
};

type PageProps = {
  searchParams?: JobsPageSearchParams;
};

function firstString(value?: string | string[]): string {
  if (Array.isArray(value)) return value[0] || "";
  return value || "";
}

export default async function AtsJobsPage({ searchParams = {} }: PageProps) {
  const tenant = await getResourcinTenant();
  if (!tenant) notFound();

  // 🔐 Ensure current user is a member of this tenant with an allowed role
  await requireTenantMembership(tenant.id, {
    allowedRoles: ["OWNER", "ADMIN", "RECRUITER"],
  });

  const filterQ = firstString(searchParams.q).trim();
  // ...rest of your file unchanged
}
