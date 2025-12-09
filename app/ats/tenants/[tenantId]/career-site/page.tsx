// app/ats/tenants/[tenantId]/careersite/page.tsx
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

type PageProps = {
  params: {
    tenantId: string;
  };
  searchParams?: {
    saved?: string;
  };
};

export default async function TenantCareerSitePage({
  params,
  searchParams,
}: PageProps) {
  const tenantId = params.tenantId;
  const saved = searchParams?.saved === "1";

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      id: true,
      name: true,
      slug: true,
      logoUrl: true,
    },
  });

  if (!tenant) {
    notFound();
  }

  const existingSettings = await prisma.careerSiteSettings.findFirst({
    where: { tenantId },
  });

  async function saveCareerSiteSettings(formData: FormData) {
    "use server";

    const tenantId = formData.get("tenantId") as string;

    const heroTitle = (formData.get("heroTitle") as string | null) || null;
    const heroSubtitle =
      (formData.get("heroSubtitle") as string | null) || null;
    const aboutHtml = (formData.get("aboutHtml") as string | null) || null;
    const logoUrl = (formData.get("logoUrl") as string | null) || null;
    const bannerImageUrl =
      (formData.get("bannerImageUrl") as string | null) || null;

    const primaryColorHex =
      (formData.get("primaryColorHex") as string | null) || null;
    const accentColorHex =
      (formData.get("accentColorHex") as string | null) || null;
    const heroBackgroundHex =
      (formData.get("heroBackgroundHex") as string | null) || null;

    const linkedinUrl =
      (formData.get("linkedinUrl") as string | null) || null;
    const twitterUrl =
      (formData.get("twitterUrl") as string | null) || null;
    const instagramUrl =
      (formData.get("instagramUrl") as string | null) || null;

    const includeInMarketplace =
      formData.get("includeInMarketplace") === "on";
    const isPublic = formData.get("isPublic") === "on";

    if (existingSettings) {
      await prisma.careerSiteSettings.update({
        where: { id: existingSettings.id },
        data: {
          heroTitle,
          heroSubtitle,
          aboutHtml,
          logoUrl,
          bannerImageUrl,
          primaryColorHex,
          accentColorHex,
          heroBackgroundHex,
          linkedinUrl,
          twitterUrl,
          instagramUrl,
          includeInMarketplace,
          isPublic,
        },
      });
    } else {
      await prisma.careerSiteSettings.create({
        data: {
          tenantId,
          heroTitle,
          heroSubtitle,
          aboutHtml,
          logoUrl,
          bannerImageUrl,
          primaryColorHex,
          accentColorHex,
          heroBackgroundHex,
          linkedinUrl,
          twitterUrl,
          instagramUrl,
          includeInMarketplace,
          isPublic,
        },
      });
    }

    revalidatePath(`/ats/tenants/${tenantId}`);
    revalidatePath(`/ats/tenants/${tenantId}/careersite`);
    redirect(`/ats/tenants/${tenantId}/careersite?saved=1`);
  }

  const s = existingSettings;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-8 lg:px-8 lg:py-10">
        <header className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-400">
              Careersite configuration
            </p>
            <h1 className="mt-2 text-xl font-semibold text-slate-50">
              {tenant.name} careers site
            </h1>
            <p className="mt-1 text-xs text-slate-400">
              Control the hero copy, colours, imagery and social links that
              appear on the public careers page for this tenant.
            </p>
          </div>
        </header>

        {saved && (
          <div className="mb-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-200">
            Careersite settings saved.
          </div>
        )}

        <form
          action={saveCareerSiteSettings}
          className="space-y-8 rounded-2xl border border-slate-800 bg-slate-900/60 p-5"
        >
          <input type="hidden" name="tenantId" value={tenantId} />

          {/* Hero section */}
          <section className="space-y-4">
            <h2 className="text-sm font-semibold text-slate-100">
              Hero & intro
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label
                  htmlFor="heroTitle"
                  className="block text-xs font-medium text-slate-200"
                >
                  Hero title
                </label>
                <input
                  id="heroTitle"
                  name="heroTitle"
                  type="text"
                  defaultValue={s?.heroTitle ?? ""}
                  placeholder={`Careers at ${tenant.name}`}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="heroSubtitle"
                  className="block text-xs font-medium text-slate-200"
                >
                  Hero subtitle
                </label>
                <input
                  id="heroSubtitle"
                  name="heroSubtitle"
                  type="text"
                  defaultValue={s?.heroSubtitle ?? ""}
                  placeholder="A short, one-line promise to candidates."
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="aboutHtml"
                className="block text-xs font-medium text-slate-200"
              >
                About section (supports basic HTML)
              </label>
              <textarea
                id="aboutHtml"
                name="aboutHtml"
                rows={4}
                defaultValue={
                  s?.aboutHtml ??
                  `<p>We&apos;re building a thoughtful, high-trust environment where good people can do their best work.</p>`
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
              <p className="text-[11px] text-slate-500">
                You can use simple HTML tags like <code>&lt;p&gt;</code>,{" "}
                <code>&lt;strong&gt;</code>, and <code>&lt;ul&gt;</code> for
                light formatting.
              </p>
            </div>
          </section>

          {/* Branding section */}
          <section className="space-y-4">
            <h2 className="text-sm font-semibold text-slate-100">
              Branding & visuals
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label
                  htmlFor="logoUrl"
                  className="block text-xs font-medium text-slate-200"
                >
                  Careersite logo URL
                </label>
                <input
                  id="logoUrl"
                  name="logoUrl"
                  type="text"
                  defaultValue={s?.logoUrl ?? tenant.logoUrl ?? ""}
                  placeholder="https://…/logo.png"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
                <p className="text-[11px] text-slate-500">
                  Optional. If empty, the tenant&apos;s default logo will be
                  used where available.
                </p>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="bannerImageUrl"
                  className="block text-xs font-medium text-slate-200"
                >
                  Hero banner image URL
                </label>
                <input
                  id="bannerImageUrl"
                  name="bannerImageUrl"
                  type="text"
                  defaultValue={s?.bannerImageUrl ?? ""}
                  placeholder="https://…/office-banner.jpg"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
                <p className="text-[11px] text-slate-500">
                  Large, wide image used in the hero (e.g. team photo or office
                  shot).
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <label
                  htmlFor="primaryColorHex"
                  className="block text-xs font-medium text-slate-200"
                >
                  Primary colour (hex)
                </label>
                <input
                  id="primaryColorHex"
                  name="primaryColorHex"
                  type="text"
                  defaultValue={s?.primaryColorHex ?? ""}
                  placeholder="#172965"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="accentColorHex"
                  className="block text-xs font-medium text-slate-200"
                >
                  Accent colour (hex)
                </label>
                <input
                  id="accentColorHex"
                  name="accentColorHex"
                  type="text"
                  defaultValue={s?.accentColorHex ?? ""}
                  placeholder="#FFC000"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="heroBackgroundHex"
                  className="block text-xs font-medium text-slate-200"
                >
                  Hero background colour (hex)
                </label>
                <input
                  id="heroBackgroundHex"
                  name="heroBackgroundHex"
                  type="text"
                  defaultValue={s?.heroBackgroundHex ?? ""}
                  placeholder="#020617"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>
            </div>
          </section>

          {/* Socials */}
          <section className="space-y-4">
            <h2 className="text-sm font-semibold text-slate-100">
              Social links
            </h2>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <label
                  htmlFor="linkedinUrl"
                  className="block text-xs font-medium text-slate-200"
                >
                  LinkedIn URL
                </label>
                <input
                  id="linkedinUrl"
                  name="linkedinUrl"
                  type="text"
                  defaultValue={s?.linkedinUrl ?? ""}
                  placeholder="https://www.linkedin.com/company/…"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="twitterUrl"
                  className="block text-xs font-medium text-slate-200"
                >
                  X / Twitter URL
                </label>
                <input
                  id="twitterUrl"
                  name="twitterUrl"
                  type="text"
                  defaultValue={s?.twitterUrl ?? ""}
                  placeholder="https://x.com/…"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="instagramUrl"
                  className="block text-xs font-medium text-slate-200"
                >
                  Instagram URL
                </label>
                <input
                  id="instagramUrl"
                  name="instagramUrl"
                  type="text"
                  defaultValue={s?.instagramUrl ?? ""}
                  placeholder="https://www.instagram.com/…"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>
            </div>
          </section>

          {/* Visibility */}
          <section className="space-y-3 border-t border-slate-800 pt-4">
            <h2 className="text-sm font-semibold text-slate-100">
              Visibility
            </h2>
            <div className="space-y-2 text-xs text-slate-300">
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  name="isPublic"
                  defaultChecked={s?.isPublic ?? true}
                  className="h-3.5 w-3.5 rounded border-slate-600 bg-slate-950 text-sky-500 focus:ring-sky-500"
                />
                <span>Careersite is publicly accessible</span>
              </label>
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  name="includeInMarketplace"
                  defaultChecked={s?.includeInMarketplace ?? false}
                  className="h-3.5 w-3.5 rounded border-slate-600 bg-slate-950 text-sky-500 focus:ring-sky-500"
                />
                <span>
                  Allow selected roles to appear in the ThinkATS marketplace
                </span>
              </label>
            </div>
          </section>

          <div className="flex items-center justify-between border-t border-slate-800 pt-4">
            <p className="text-[11px] text-slate-500">
              Changes apply to{" "}
              <span className="font-medium">
                {tenant.slug}.thinkats.com/careers
              </span>{" "}
              (and any mapped custom domains for this tenant).
            </p>
            <button
              type="submit"
              className="inline-flex items-center rounded-full bg-sky-500 px-4 py-2 text-xs font-semibold text-slate-950 shadow-sm shadow-sky-500/30 hover:bg-sky-400"
            >
              Save careersite
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
