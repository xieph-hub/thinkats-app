// app/ats/tenants/[tenantId]/careersite/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Career site settings | ThinkATS",
  description:
    "Configure the public career site for this ATS workspace (tenant).",
};

type PageProps = {
  params: { tenantId: string };
  searchParams?: { saved?: string };
};

export default async function TenantCareerSitePage({
  params,
  searchParams,
}: PageProps) {
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

  const saved = searchParams?.saved === "1";

  return (
    <div className="mx-auto max-w-4xl space-y-6 py-6">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold text-slate-900">
          Career site for {tenant?.name || tenant?.slug}
        </h1>
        <p className="text-xs text-slate-600">
          Control how your public jobs page looks and whether it is visible to
          candidates.
        </p>
      </header>

      {saved && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
          Career site settings saved.
        </div>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <form
          method="POST"
          action={`/api/ats/tenants/${tenantId}/careersite`}
          className="space-y-4 text-sm"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label
                htmlFor="heroTitle"
                className="text-xs font-medium text-slate-700"
              >
                Hero title
              </label>
              <input
                id="heroTitle"
                name="heroTitle"
                required
                defaultValue={settings?.heroTitle ?? ""}
                placeholder="Work with Resourcin’s high-trust clients"
                className="block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
              />
              <p className="text-[11px] text-slate-500">
                The main headline candidates see at the top of your careers
                page.
              </p>
            </div>

            <div className="space-y-1">
              <label
                htmlFor="heroSubtitle"
                className="text-xs font-medium text-slate-700"
              >
                Hero subtitle
              </label>
              <input
                id="heroSubtitle"
                name="heroSubtitle"
                defaultValue={settings?.heroSubtitle ?? ""}
                placeholder="We help high-growth companies build honest, high-performing teams."
                className="block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
              />
              <p className="text-[11px] text-slate-500">
                A short line under the title giving context about who you are.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label
                htmlFor="primaryColor"
                className="text-xs font-medium text-slate-700"
              >
                Primary color (optional)
              </label>
              <input
                id="primaryColor"
                name="primaryColor"
                defaultValue={settings?.primaryColor ?? ""}
                placeholder="#172965"
                className="block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
              />
              <p className="text-[11px] text-slate-500">
                Hex color for buttons and highlights on the careers page.
              </p>
            </div>

            <div className="space-y-1">
              <label
                htmlFor="accentColor"
                className="text-xs font-medium text-slate-700"
              >
                Accent color (optional)
              </label>
              <input
                id="accentColor"
                name="accentColor"
                defaultValue={settings?.accentColor ?? ""}
                placeholder="#64C247"
                className="block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
              />
              <p className="text-[11px] text-slate-500">
                Secondary color for tags, badges and subtle accents.
              </p>
            </div>
          </div>

          <div className="space-y-1">
            <label
              htmlFor="aboutHtml"
              className="text-xs font-medium text-slate-700"
            >
              About section (optional)
            </label>
            <textarea
              id="aboutHtml"
              name="aboutHtml"
              rows={5}
              defaultValue={settings?.aboutHtml ?? ""}
              placeholder="Write a short overview of your company, mission and culture. This appears above the list of open roles."
              className="block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
            />
            <p className="text-[11px] text-slate-500">
              Basic rich text can come later — for now this is a plain text
              block shown on the careers page.
            </p>
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
            <label className="flex items-center gap-2 text-xs text-slate-700">
              <input
                type="checkbox"
                name="isPublic"
                defaultChecked={settings?.isPublic ?? true}
                className="h-4 w-4 rounded border-slate-300 text-[#172965] focus:ring-[#172965]"
              />
              <span>Make this career site public</span>
            </label>
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-full bg-[#172965] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#0f1c48]"
            >
              Save career site
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
        <p className="font-medium text-slate-800">Public URL</p>
        <p className="mt-1">
          For now, each tenant’s careers page will live at:
        </p>
        <p className="mt-1 font-mono text-[11px] text-slate-800">
          https://www.thinkats.com/jobs?tenant={tenantId}
        </p>
        <p className="mt-1">
          Later, higher tiers can map{" "}
          <span className="font-mono text-[11px]">
            clientname.thinkats.com
          </span>{" "}
          or a custom domain.
        </p>
      </section>
    </div>
  );
}
