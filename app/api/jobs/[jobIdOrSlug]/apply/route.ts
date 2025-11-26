// app/api/jobs/[jobIdOrSlug]/apply/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

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

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value
  );
}

// Public-safe job resolver – no tenant cookie required
async function resolvePublicJob(jobIdOrSlug: string) {
  const isId = isUuid(jobIdOrSlug);

  let query = supabaseAdmin
    .from("jobs")
    .select(
      `
      id,
      tenant_id,
      title,
      slug,
      status,
      visibility
    `
    )
    .eq("visibility", "public");

  // Only allow applications to open roles
  query = query.eq("status", "open");

  if (isId) {
    query = query.eq("id", jobIdOrSlug);
  } else {
    query = query.eq("slug", jobIdOrSlug);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    console.error("Error loading job for application:", error);
    throw new Error("Error loading job");
  }

  if (!data) {
    throw new Error("Job not found or not open");
  }

  return data as {
    id: string;
    tenant_id: string;
    title: string;
    slug: string | null;
    status: string | null;
    visibility: string | null;
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

    // 1) Resolve the job purely from slug/id (public-safe)
    const job = await resolvePublicJob(rawJobId);

    // 2) Normalise fields
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

    // 3) Insert into job_applications
    // IMPORTANT: we do NOT send tenant_id here, your table currently does not have that column.
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
