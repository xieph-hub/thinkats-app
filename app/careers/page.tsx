// app/careers/page.tsx
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getHostContext } from "@/lib/host";
import CareersPageRenderer from "@/components/careers/CareersPageRenderer";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Careers | ThinkATS",
  description:
    "Explore roles hosted by ThinkATS clients, with white-label careers sites on dedicated subdomains.",
};

async function getPublicJobsForCareersSite(args: {
  tenantId: string;
  clientCompanyId?: string | null;
}) {
  const where: any = {
    tenantId: args.tenantId,
    status: "open",
    visibility: "public",
    OR: [{ internalOnly: false }, { internalOnly: null }],
  };

  if (args.clientCompanyId) {
    where.clientCompanyId = args.clientCompanyId;
  }

  return prisma.job.findMany({
    where,
    orderBy: {
      createdAt: "desc",
    },
    include: {
      clientCompany: true,
    },
  });
}

export default async function CareersPage() {
  const hostContext = await getHostContext();
  const {
    isAppHost,
    isCareersiteHost,
    tenant,
    clientCompany,
    host,
  } = hostContext;

  // 1) Careersite-ish host but no tenant or client resolved → soft "not configured"
  if (isCareersiteHost && !tenant && !clientCompany) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-slate-50">
        <div className="max-w-md rounded-2xl border border-slate-800 bg-slate-900/70 p-6 text-center">
          <h1 className="text-lg font-semibold">
            This careers site isn&apos;t configured yet
          </h1>
          <p className="mt-3 text-sm text-slate-400">
            We couldn&apos;t find a live careers configuration for{" "}
            <span className="font-mono text-slate-200">{host}</span>. If you
            expected to see open roles here, please contact ThinkATS support.
          </p>
        </div>
      </main>
    );
  }

  // 2) Tenant / client careersite host (subdomain or custom domain) OR main app host
  //    - When tenant exists → show that tenant/client’s jobs.
  //    - When no tenant (www.thinkats.com) → renderer will just show the global shell.
  let jobs: any[] = [];

  if (tenant) {
    jobs = await getPublicJobsForCareersSite({
      tenantId: tenant.id,
      clientCompanyId: clientCompany?.id ?? null,
    });
  } else if (isAppHost) {
    // Global app host (thinkats.com/careers or www.thinkats.com/careers)
    // For now we keep this as a marketplace shell with zero jobs.
    // Later you can hydrate with featured marketplace roles.
    jobs = [];
  }

  return (
    <CareersPageRenderer hostContext={hostContext} page="careers" jobs={jobs} />
  );
}
