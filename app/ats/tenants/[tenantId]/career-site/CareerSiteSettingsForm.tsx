"use client";

import { useState } from "react";

type CareerSiteSettingsFormProps = {
  tenantId: string;
  tenantName: string;
  initialValues: {
    heroTitle: string;
    heroSubtitle: string;
    aboutHtml: string;
    logoUrl: string;
    bannerImageUrl: string;
    linkedinUrl: string;
    twitterUrl: string;
    instagramUrl: string;
  };
};

export default function CareerSiteSettingsForm({
  tenantId,
  tenantName,
  initialValues,
}: CareerSiteSettingsFormProps) {
  const [form, setForm] = useState(initialValues);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");

  function updateField<K extends keyof typeof initialValues>(
    key: K,
    value: string,
  ) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSaving(true);
    setStatus("idle");

    try {
      const res = await fetch(`/api/ats/tenants/${tenantId}/career-site`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        throw new Error("Failed to save settings");
      }

      setStatus("saved");
    } catch (err) {
      console.error(err);
      setStatus("error");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-8 rounded-2xl border border-slate-800 bg-slate-900/70 p-6"
    >
      <header className="space-y-1">
        <h1 className="text-lg font-semibold text-slate-50">
          Careers site for {tenantName}
        </h1>
        <p className="text-xs text-slate-400">
          Configure the hero copy, about section and social links that
          appear on this tenant&apos;s public careers site.
        </p>
      </header>

      {/* HERO SECTION */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-slate-200">
          Hero section
        </h2>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-300">
              Hero title
            </label>
            <input
              type="text"
              value={form.heroTitle}
              onChange={(e) => updateField("heroTitle", e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              placeholder="Careers at Acme"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300">
              Hero subtitle
            </label>
            <textarea
              value={form.heroSubtitle}
              onChange={(e) => updateField("heroSubtitle", e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              rows={2}
              placeholder="Join a team that values thoughtful work and long-term thinking."
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300">
              Banner image URL
            </label>
            <input
              type="url"
              value={form.bannerImageUrl}
              onChange={(e) =>
                updateField("bannerImageUrl", e.target.value)
              }
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              placeholder="https://…/banner.jpg"
            />
            <p className="mt-1 text-xs text-slate-500">
              Optional. Used as the visual backdrop on the careers hero.
              Leave blank to use the default gradient.
            </p>
          </div>
        </div>
      </section>

      {/* ABOUT SECTION */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-slate-200">
          About section
        </h2>
        <div className="space-y-2">
          <label className="block text-xs font-medium text-slate-300">
            About copy (HTML allowed)
          </label>
          <textarea
            value={form.aboutHtml}
            onChange={(e) => updateField("aboutHtml", e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-mono text-slate-50 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            rows={6}
            placeholder="<p>We run a calm, high-trust environment where good people do their best work.</p>"
          />
          <p className="text-xs text-slate-500">
            You can use simple HTML tags (&lt;p&gt;, &lt;strong&gt;,
            &lt;ul&gt;, &lt;li&gt;) to structure this section.
          </p>
        </div>
      </section>

      {/* LOGO + SOCIALS */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-slate-200">
          Logo & social links
        </h2>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-300">
              Careers logo URL
            </label>
            <input
              type="url"
              value={form.logoUrl}
              onChange={(e) => updateField("logoUrl", e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              placeholder="https://…/logo.svg"
            />
            <p className="mt-1 text-xs text-slate-500">
              Optional. Overrides the tenant or client logo on the public
              careers site.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-slate-300">
                LinkedIn URL
              </label>
              <input
                type="url"
                value={form.linkedinUrl}
                onChange={(e) =>
                  updateField("linkedinUrl", e.target.value)
                }
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                placeholder="https://www.linkedin.com/company/…"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300">
                Twitter / X URL
              </label>
              <input
                type="url"
                value={form.twitterUrl}
                onChange={(e) =>
                  updateField("twitterUrl", e.target.value)
                }
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                placeholder="https://x.com/…"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300">
                Instagram URL
              </label>
              <input
                type="url"
                value={form.instagramUrl}
                onChange={(e) =>
                  updateField("instagramUrl", e.target.value)
                }
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                placeholder="https://www.instagram.com/…"
              />
            </div>
          </div>
        </div>
      </section>

      <footer className="flex items-center justify-between gap-4 border-t border-slate-800 pt-4">
        <div className="text-xs text-slate-500">
          {status === "saved" && (
            <span className="text-emerald-400">Saved</span>
          )}
          {status === "error" && (
            <span className="text-rose-400">
              Couldn&apos;t save. Please try again.
            </span>
          )}
        </div>
        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? "Saving…" : "Save changes"}
        </button>
      </footer>
    </form>
  );
}
