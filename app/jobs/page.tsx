// app/jobs/page.tsx
import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getCurrentTenantId } from "@/lib/tenant";

type JobRecord = {
  id: string;
  title: string;
  slug: string | null;
  short_description: string | null;
  location: string | null;
  work_mode: "remote" | "hybrid" | "onsite" | "flexible" | null;
  visibility: "public" | "internal" | "confidential";
  internal_only: boolean;
  status: "open" | "draft";
  created_at: string;
};

// While we’re debugging, force dynamic so new jobs show up immediately.
export const dynamic = "force-dynamic";

export default async function JobsPage() {
  const tenantId = getCurrentTenantId();

  const { data, error } = await supabaseAdmin
    .from("jobs")
    .select(
      "id, title, slug, short_description, location, work_mode, visibility, internal_only, status, created_at"
    )
    .eq("tenant_id", tenantId)
    .eq("status", "open")
    .eq("internal_only", false)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error loading public jobs", error);
    return (
      <div className="mx-auto max-w-4xl px-4 py-16">
        <h1 className="text-2xl font-semibold tracking-tight">Open roles</h1>
        <p className="mt-4 text-sm text-red-600">
          We couldn&apos;t load roles at the moment. Please try again shortly.
        </p>
      </div>
    );
  }

  const jobs = (data ?? []) as JobRecord[];

  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">Open roles</h1>
        <p className="mt-2 text-sm text-gray-500">
          Mandates Resourcin is currently leading. Some searches are public,
          others are confidential – we note this on each role.
        </p>
      </header>

      {jobs.length === 0 ? (
        <p className="text-sm text-gray-500">
          No open roles right now. Check back soon or share your CV to join our
          talent network.
        </p>
      ) : (
        <ul className="grid gap-4">
          {jobs.map((job) => {
            const isConfidential = job.visibility === "confidential";

            const href = job.slug
              ? `/jobs/${job.slug}`
              : `/jobs/${job.id}`;

            return (
              <li key={job.id}>
                <Link
                  href={href}
                  className="block rounded-xl border border-gray-200 bg-white p-4 hover:border-gray-900 hover:bg-gray-50"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-base font-semibold">
                        {job.title}
                      </h2>
                      <p className="mt-1 text-xs text-gray-500">
                        {job.location || "Location flexible"}
                        {job.work_mode
                          ? ` • ${
                              job.work_mode.charAt(0).toUpperCase() +
                              job.work_mode.slice(1)
                            }`
                          : null}
                      </p>
                      {job.short_description && (
                        <p className="mt-2 line-clamp-2 text-sm text-gray-600">
                          {job.short_description}
                        </p>
                      )}
                    </div>

                    <span
                      className={[
                        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                        isConfidential
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : "bg-emerald-50 text-emerald-700 border border-emerald-200",
                      ].join(" ")}
                    >
                      {isConfidential ? "Confidential search" : "Open role"}
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
