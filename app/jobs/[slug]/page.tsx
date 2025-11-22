// app/jobs/[slug]/page.tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import ApplyForm from "./ApplyForm";

type JobRow = {
  id: string;
  slug: string | null;
  title: string;
  location: string | null;
  description: string | null;
  function?: string | null;
  employment_type?: string | null;
};

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
  }

  const key = serviceKey || anonKey;
  if (!key) {
    throw new Error(
      "Neither SUPABASE_SERVICE_ROLE_KEY nor NEXT_PUBLIC_SUPABASE_ANON_KEY is set"
    );
  }

  return createClient(url, key);
}

async function fetchPublicJob(slugOrId: string): Promise<JobRow | null> {
  const supabase = getSupabaseAdmin();

  const looksLikeUuid =
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
      slugOrId
    );

  let query = supabase
    .from("jobs")
    .select(
      "id, slug, title, location, description, function, employment_type, status, visibility"
    )
    .eq("status", "open")
    .eq("visibility", "public")
    .limit(1);

  if (looksLikeUuid) {
    query = query.eq("id", slugOrId);
  } else {
    query = query.eq("slug", slugOrId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error loading public job for /jobs/[slug]:", error);
    return null;
  }

  if (!data || data.length === 0) return null;

  const row: any = data[0];

  return {
    id: row.id,
    slug: row.slug ?? null,
    title: row.title,
    location: row.location ?? null,
    description: row.description ?? null,
    function: row.function ?? null,
    employment_type: row.employment_type ?? null,
  };
}

export default async function JobDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const job = await fetchPublicJob(params.slug);

  if (!job) {
    notFound();
  }

  const slugOrId = job.slug ?? job.id;

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <nav className="mb-4 text-xs text-slate-500">
        <Link href="/jobs" className="hover:text-[#172965]">
          ← Back to all jobs
        </Link>
      </nav>

      <header className="mb-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          Open role
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">
          {job.title}
        </h1>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-600">
          {job.location && (
            <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5">
              {job.location}
            </span>
          )}
          {job.employment_type && (
            <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5">
              {job.employment_type}
            </span>
          )}
          {job.function && (
            <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5">
              {job.function}
            </span>
          )}
        </div>
      </header>

      <section className="prose prose-sm max-w-none text-slate-800">
        {job.description ? (
          <p style={{ whiteSpace: "pre-wrap" }}>{job.description}</p>
        ) : (
          <p className="text-sm text-slate-600">
            No detailed description has been added for this role yet.
          </p>
        )}
      </section>

      {/* Inline apply form */}
      <ApplyForm jobSlug={slugOrId} jobTitle={job.title} />
    </main>
  );
}
