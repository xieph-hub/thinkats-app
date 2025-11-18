// app/careers/page.tsx
import { headers } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabaseServerClient";

export default async function CareersPage() {
  const hdrs = headers();
  const tenantSlug = hdrs.get("x-tenant-slug");

  // If no tenant slug (e.g. resourcin.com/careers directly)
  if (!tenantSlug) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-16">
        <h1 className="text-2xl font-semibold text-slate-900">Careers</h1>
        <p className="mt-2 text-sm text-slate-600">
          This careers page is accessed without a tenant subdomain.
          To view a client&apos;s career site, visit a URL like
          <code className="mx-1 rounded bg-slate-100 px-1 py-0.5 text-[11px]">
            clientslug.resourcin.com/careers
          </code>
          .
        </p>
      </main>
    );
  }

  const supabase = createSupabaseServerClient();

  // Tenant
  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .select("id, name")
    .eq("slug", tenantSlug)
    .single();

  if (tenantError || !tenant) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-16">
        <h1 className="text-2xl font-semibold text-slate-900">Careers</h1>
        <p className="mt-2 text-sm text-slate-600">
          We couldn&apos;t find this career site.
        </p>
      </main>
    );
  }

  // Career site settings
  const { data: settings } = await supabase
    .from("career_site_settings")
    .select("*")
    .eq("tenant_id", tenant.id)
    .single();

  // Jobs
  const { data: jobs } = await supabase
    .from("jobs")
    .select("id, title, department, location, employment_type, created_at")
    .eq("tenant_id", tenant.id)
    .eq("status", "open")
    .eq("visibility", "public")
    .order("created_at", { ascending: false });

  const heroTitle = settings?.hero_title || `Join ${tenant.name}`;
  const heroSubtitle =
    settings?.hero_subtitle || "Explore open roles and opportunities.";

  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <section className="mb-8">
        <h1 className="text-3xl font-semibold text-slate-900">
          {heroTitle}
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          {heroSubtitle}
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-slate-900">
          Open roles
        </h2>
        {jobs && jobs.length > 0 ? (
          <ul className="space-y-3">
            {jobs.map((job) => (
              <li
                key={job.id}
                className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">
                      {job.title}
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                      {job.department && `${job.department} • `}
                      {job.location}
                    </p>
                  </div>
                  {/* Later: link to a job detail page like /careers/[jobId] */}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-600">
            There are currently no open roles.
          </p>
        )}
      </section>
    </main>
  );
}
