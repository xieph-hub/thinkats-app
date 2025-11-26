// app/ats/jobs/new/page.tsx
import { prisma } from "@/lib/prisma";
import { getResourcinTenant } from "@/lib/tenant";
import { JobCreateForm } from "./JobCreateForm";

export const dynamic = "force-dynamic";

export default async function NewJobPage() {
  const tenant = await getResourcinTenant();

  const clientCompanies = await prisma.clientCompany.findMany({
    where: { tenantId: tenant.id, isActive: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-semibold text-slate-900">
        Create new job
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        This creates an internal ATS job for the Resourcin tenant. Public
        visibility is controlled via the flags below.
      </p>

      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6">
        <JobCreateForm clientCompanies={clientCompanies} />
      </div>
    </div>
  );
}
