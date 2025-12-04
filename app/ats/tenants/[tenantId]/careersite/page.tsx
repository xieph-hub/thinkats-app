// app/ats/tenants/[tenantId]/careersite/page.tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ensureOtpVerified } from "@/lib/requireOtp";

type Props = {
  params: { tenantId: string };
  searchParams?: { saved?: string };
};

export const dynamic = "force-dynamic";

export default async function TenantCareersSettingsPage({
  params,
  searchParams,
}: Props) {
  await ensureOtpVerified("/ats");

  const tenantId = params.tenantId;

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: {
      careerSiteSettings: true,
    },
  });

  if (!tenant) {
    notFound();
  }

  const settings = tenant.careerSiteSettings[0] ?? null;
  const saved = searchParams?.saved === "1";

  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://www.thinkats.com";
  const publicUrl = `${baseUrl}/careers/${encodeURIComponent(tenant.slug)}`;

  return (
    <div className="mx-auto max-w-3xl py-6">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">
            Careers site for {tenant.name}
          </h1>
          <p className="mt-1 text-xs text-slate-600">
            Configure the public careers page for this workspace. The URL
            below can be linked from your main website.
          </p>
        </div>
        <Link
          href="/ats/tenants"
          className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
        >
          ← Back to workspaces
        </Link>
      </div>

      {saved && (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
          Careers site settings saved.
        </div>
      )}

      <div className="mb-4 rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-700">
        <p className="font-semibold text-slate-900">Public URL</p>
        <div className="mt-1 flex items-center justify-between gap-2">
          <code className="rounded bg-slate-50 px-2 py-1 text-[11px]">
            {publicUrl}
          </code>
          <a
            href={publicUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-full bg-slate-900 px-3 py-1 text-[11px] font-semibold text-white hover:bg-slate-800"
          >
            Open
          </a>
        </div>
        <p className="mt-1 text-[11px] text-slate-500">
          You can link this from your website as &ldquo;Careers&rdquo; or
          &ldquo;Open roles&rdquo;.
        </p>
      </div>

      <form
        method="POST"
        action={`/ats/tenants/${encodeURIComponent(
          tenantId,
        )}/careersite`}
        className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 text-sm shadow-sm"
      >
        <input type="hidden" name="tenantId" value={tenantId} />

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
            defaultValue={settings?.heroTitle ?? ""}
            placeholder={`Join ${tenant.name}`}
            className="block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
          />
        </div>

        <div className="space-y-1">
          <label
            htmlFor="heroSubtitle"
            className="text-xs font-medium text-slate-700"
          >
            Hero subtitle
          </label>
          <textarea
            id="heroSubtitle"
            name="heroSubtitle"
            rows={2}
            defaultValue={settings?.heroSubtitle ?? ""}
            placeholder="One or two sentences on why someone should work with this organisation."
            className="block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
          />
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
            placeholder="You can paste simple HTML here (paragraphs, lists, links) to describe the company, culture, benefits, etc."
            className="block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
          />
          <p className="mt-1 text-[10px] text-slate-500">
            Keep it simple – headings, paragraphs and bullet lists work best.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <label
              htmlFor="primaryColor"
              className="text-xs font-medium text-slate-700"
            >
              Primary colour (hex)
            </label>
            <input
              id="primaryColor"
              name="primaryColor"
              defaultValue={settings?.primaryColor ?? ""}
              placeholder="#172965"
              className="block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
            />
          </div>
          <div className="space-y-1">
            <label
              htmlFor="accentColor"
              className="text-xs font-medium text-slate-700"
            >
              Accent colour (hex)
            </label>
            <input
              id="accentColor"
              name="accentColor"
              defaultValue={settings?.accentColor ?? ""}
              placeholder="#FFC000"
              className="block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            id="isPublic"
            name="isPublic"
            type="checkbox"
            defaultChecked={settings?.isPublic ?? true}
            className="h-4 w-4 rounded border-slate-300 text-[#172965] focus:ring-[#172965]"
          />
          <label
            htmlFor="isPublic"
            className="text-xs text-slate-700"
          >
            Make this careers page publicly available
          </label>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-full bg-[#172965] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#0f1c48]"
          >
            Save settings
          </button>
        </div>
      </form>
    </div>
  );
}
