// app/careers/page.tsx
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getHostContext } from "@/lib/host";
import CareersSitePage from "@/components/careers/CareersSitePage";

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
    OR: [
      { internalOnly: false },
      { internalOnly: null },
    ],
  };

  if (args.clientCompanyId) {
    where.clientCompanyId = args.clientCompanyId;
  }

  return prisma.job.findMany({
    where,
    orderBy: {
      createdAt: "desc",
    },
  });
}

export default async function CareersPage() {
  const hostCtx = await getHostContext();
  const {
    isAppHost,
    isCareersiteHost,
    tenant,
    clientCompany,
    careerSiteSettings,
    host,
  } = hostCtx;

  // ---------------------------------------------------------------------------
  // 1) Careersite host but nothing resolved → show a soft "not configured" page
  // ---------------------------------------------------------------------------
  if (isCareersiteHost && !tenant && !clientCompany) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-slate-50">
        <div className="max-w-md rounded-2xl border border-slate-800 bg-slate-900/70 p-6 text-center">
          <h1 className="text-lg font-semibold">
            This careers site isn&apos;t configured yet
          </h1>
          <p className="mt-3 text-sm text-slate-400">
            We couldn&apos;t find a live careers configuration for{" "}
            <span className="font-mono text-slate-200">{host}</span>. If
            you expected to see open roles here, please contact ThinkATS
            support.
          </p>
        </div>
      </main>
    );
  }

  // ---------------------------------------------------------------------------
  // 2) Client-company careersite (ideal path)
  // ---------------------------------------------------------------------------
  if (clientCompany && tenant) {
    const jobs = await getPublicJobsForCareersSite({
      tenantId: tenant.id,
      clientCompanyId: clientCompany.id,
    });

    return (
      <CareersSitePage
        tenant={tenant}
        clientCompany={clientCompany}
        settings={careerSiteSettings}
        jobs={jobs}
      />
    );
  }

  // ---------------------------------------------------------------------------
  // 3) Direct-tenant careersite (tenant slug as subdomain)
  // ---------------------------------------------------------------------------
  if (tenant && !isAppHost) {
    const jobs = await getPublicJobsForCareersSite({
      tenantId: tenant.id,
      clientCompanyId: null,
    });

    return (
      <CareersSitePage
        tenant={tenant}
        clientCompany={null}
        settings={careerSiteSettings}
        jobs={jobs}
      />
    );
  }

  // ---------------------------------------------------------------------------
  // 4) Main app host (thinkats.com/careers) – keep this simple.
  //    We are NOT touching app/page.tsx, so your main homepage stays as-is.
  // ---------------------------------------------------------------------------
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-12 text-slate-50">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">
            Careers powered by ThinkATS
          </h1>
          <p className="text-sm text-slate-400">
            This is the global careers entry point for roles managed on
            ThinkATS. Individual client careers sites live on their own
            subdomains, for example{" "}
            <span className="font-mono text-sky-400">
              acme.thinkats.com/careers
            </span>
            .
          </p>
        </header>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-sm text-slate-300">
          <p>
            You can turn this page into a marketplace of featured roles
            later – for now, the primary experience is each client&apos;s
            own careers microsite.
          </p>
        </div>
      </div>
    </main>
  );
}
