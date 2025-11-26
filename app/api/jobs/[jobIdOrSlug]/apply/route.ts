// app/api/jobs/[jobIdOrSlug]/apply/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getCurrentTenantId } from "@/lib/tenant"; // still used in job resolution

export const runtime = "nodejs";

type ApplyBody = {
  jobId?: string;
  job_id?: string;
  jobSlug?: string;
  slug?: string;
  fullName?: string;
  full_name?: string;
  email?: string;
  phone?: string;
  location?: string;
  cvUrl?: string;
  cv_url?: string;
  source?: string;
};

async function resolveJobForCurrentTenant(jobIdOrSlug: string) {
  const tenantId = await getCurrentTenantId();

  if (!tenantId) {
    throw new Error("No current tenant id");
  }

  // 1) Try match by id
  let { data: job, error } = await supabaseAdmin
    .from("jobs")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("id", jobIdOrSlug)
    .single();

  if (!job || error) {
    // 2) Fall back to slug
    const { data: jobBySlug, error: slugError } = await supabaseAdmin
      .from("jobs")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("slug", jobIdOrSlug)
      .single();

    if (!jobBySlug || slugError) {
      throw new Error("Job not found for this tenant");
    }

    job = jobBySlug;
  }

  return job as {
    id: string;
    tenant_id: string;
    title: string;
    slug: string | null;
  };
}

export async function POST(
  req: NextRequest,
  { params }: { params: { jobIdOrSlug: string } }
) {
  try {
    const body = (await req.json()) as ApplyBody;

    const rawJobId =
      body.jobId ||
      body.job_id ||
      body.jobSlug ||
      body.slug ||
      params.jobIdOrSlug;

    if (!rawJobId) {
      return NextResponse.json(
        { error: "Missing job identifier" },
        { status: 400 }
      );
    }

    const job = await resolveJobForCurrentTenant(rawJobId);

    const full_name = (body.fullName || body.full_name || "").trim();
    const email = (body.email || "").trim().toLowerCase();
    const phone = (body.phone || "").trim();
    const location = (body.location || "").trim();
    const cv_url = (body.cvUrl || body.cv_url || "").trim();
    const source = (body.source || "PUBLIC_JOB_BOARD").trim();

    if (!full_name || !email || !cv_url) {
      return NextResponse.json(
        {
          error:
            "full_name, email and cv_url are required to submit an application.",
        },
        { status: 400 }
      );
    }

    // 🔑 IMPORTANT: job_applications has **no tenant_id column**, so we do NOT send it.
    const insertPayload = {
      job_id: job.id,
      full_name,
      email,
      phone: phone || null,
      location: location || null,
      cv_url,
      stage: "APPLIED",
      status: "PENDING",
      source,
    };

    const { data, error } = await supabaseAdmin
      .from("job_applications")
      .insert(insertPayload)
      .select("id")
      .single();

    if (error || !data) {
      console.error("Error inserting job_application", error);
      return NextResponse.json(
        { error: "Failed to submit application" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        applicationId: data.id as string,
        message: "Application received",
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("Error in job application endpoint", err);
    return NextResponse.json(
      { error: "Unexpected error while submitting application" },
      { status: 500 }
    );
  }
}
