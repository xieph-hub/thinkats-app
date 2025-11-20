// lib/jobs.ts
//
// Central helpers for working with the `jobs` table in Supabase.
// We are NOT using Prisma here anymore – everything goes through Supabase.
//
// public.jobs columns:
//
// id                uuid        PK
// tenant_id         uuid        NOT NULL
// external_id       text        NULL
// title             text        NOT NULL
// department        text        NULL
// location          text        NULL
// employment_type   text        NULL
// seniority         text        NULL
// description       text        NULL
// hiring_manager_id uuid        NULL
// status            text        DEFAULT 'open'
// visibility        text        DEFAULT 'public'
// tags              text[]      DEFAULT '{}'::text[]
// created_by        uuid        NULL
// created_at        timestamptz DEFAULT now()
// updated_at        timestamptz DEFAULT now()
// slug              text        NULL

import supabaseAdmin from "@/lib/supabaseAdmin";
import { getCurrentTenantId } from "@/lib/tenant";

export type JobsTableRow = {
  id: string;
  tenant_id: string;
  external_id: string | null;
  title: string;
  department: string | null;
  location: string | null;
  employment_type: string | null;
  seniority: string | null;
  description: string | null;
  hiring_manager_id: string | null;
  status: string;
  visibility: string;
  tags: string[] | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  slug: string | null;
};

/**
 * List all jobs for the *current* tenant.
 *
 * - Uses getCurrentTenantId (RESOURCIN_TENANT_SLUG → tenant id)
 * - Reads from `public.jobs`
 * - Sorted newest first
 */
export async function listJobsForCurrentTenant(): Promise<JobsTableRow[]> {
  const tenantId = await getCurrentTenantId();

  if (!tenantId) {
    console.warn("listJobsForCurrentTenant: no current tenant id");
    return [];
  }

  const { data, error } = await (supabaseAdmin as any)
    .from("jobs")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (error || !data) {
    console.error("Error listing jobs for tenant", {
      tenantId,
      error,
    });
    return [];
  }

  return data as JobsTableRow[];
}

/**
 * Fetch a single job for the *current* tenant by its slug.
 *
 * Used by: app/ats/[slug]/page.tsx
 */
export async function getJobForCurrentTenantBySlug(
  slug: string
): Promise<JobsTableRow | null> {
  const tenantId = await getCurrentTenantId();

  if (!tenantId) {
    console.warn("getJobForCurrentTenantBySlug: no current tenant id");
    return null;
  }

  if (!slug) {
    console.warn("getJobForCurrentTenantBySlug: no slug provided");
    return null;
  }

  const { data, error } = await (supabaseAdmin as any)
    .from("jobs")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("slug", slug)
    .single();

  if (error || !data) {
    // If not found, Supabase returns an error – treat as "no job"
    console.error("Error fetching job by slug for tenant", {
      tenantId,
      slug,
      error,
    });
    return null;
  }

  return data as JobsTableRow;
}
