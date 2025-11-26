// app/ats/jobs/new/page.tsx
import { prisma } from "@/lib/prisma";
import JobCreateForm from "./JobCreateForm";

export const dynamic = "force-dynamic";

export default async function NewJobPage() {
  // Load all client companies for the tenant (for now, all)
  const clientCompanies = await prisma.clientCompany.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-lg font-semibold text-slate-900">
        Create new job
      </h1>
      <p className="mt-1 text-xs text-slate-500">
        Capture the bare minimum you need to launch a search. You can refine
        the description, compensation and stages later.
      </p>

      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6">
        <JobCreateForm clientCompanies={clientCompanies} />
      </div>
    </div>
  );
}
