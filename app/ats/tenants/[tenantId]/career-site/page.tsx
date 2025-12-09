import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import CareerSiteSettingsForm from "./CareerSiteSettingsForm";

export const metadata: Metadata = {
  title: "ThinkATS | Tenant careers site",
  description:
    "Configure the public careers microsite for this tenant and its clients.",
};

type PageProps = {
  params: {
    tenantId: string;
  };
};

export const dynamic = "force-dynamic";

export default async function TenantCareerSitePage({ params }: PageProps) {
  const { tenantId } = params;

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
  });

  if (!tenant) {
    notFound();
  }

  const settings = await prisma.careerSiteSettings.findFirst({
    where: { tenantId },
  });

  const initialValues = {
    heroTitle: settings?.heroTitle ?? "",
    heroSubtitle: settings?.heroSubtitle ?? "",
    aboutHtml: settings?.aboutHtml ?? "",
    logoUrl: settings?.logoUrl ?? "",
    bannerImageUrl: settings?.bannerImageUrl ?? "",
    linkedinUrl: settings?.linkedinUrl ?? "",
    twitterUrl: settings?.twitterUrl ?? "",
    instagramUrl: settings?.instagramUrl ?? "",
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 border-b border-slate-800 pb-4">
        <p className="text-xs uppercase tracking-wide text-slate-500">
          Tenant
        </p>
        <h1 className="text-xl font-semibold text-slate-50">
          {tenant.name}
        </h1>
        <p className="text-xs text-slate-400">
          Configure the public careers microsite used for this tenant and
          its client companies. Changes apply to{" "}
          <span className="font-mono text-sky-400">
            *.thinkats.com
          </span>{" "}
          hosts that resolve to this workspace.
        </p>
      </div>

      <CareerSiteSettingsForm
        tenantId={tenant.id}
        tenantName={tenant.name}
        initialValues={initialValues}
      />
    </div>
  );
}
