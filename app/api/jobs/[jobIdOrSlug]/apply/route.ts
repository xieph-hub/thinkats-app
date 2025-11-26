// app/api/jobs/[jobIdOrSlug]/apply/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getCurrentTenantId } from "@/lib/tenant";

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
    .select("id, tenant_id, title, slug")
    .eq("tenant_id", tenantId)
    .eq("id", jobIdOrSlug)
    .single();

  if (!job || error) {
    // 2) Fall back to slug
    const { data: jobBySlug, error: slugError } = await supabaseAdmin
      .from("jobs")
      .select("id, tenant_id, title, slug")
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
    const contentType = req.headers.get("content-type") || "";
    let body: ApplyBody;

    // 🔹 1) JSON body (what we originally expected)
    if (contentType.includes("application/json")) {
      body = (await req.json()) as ApplyBody;
    }
    // 🔹 2) Fallback: multipart/form-data or urlencoded (what the browser sends with file uploads)
    else if (
      contentType.includes("multipart/form-data") ||
      contentType.includes("application/x-www-form-urlencoded")
    ) {
      const formData = await req.formData();

      body = {
        jobId: (formData.get("jobId") || formData.get("job_id") || undefined) as
          | string
          | undefined,
        jobSlug: (formData.get("jobSlug") ||
          formData.get("slug") ||
          undefined) as string | undefined,
        fullName: (formData.get("fullName") ||
          formData.get("full_name") ||
          "") as string,
        email: (formData.get("email") || "") as string,
        phone: (formData.get("phone") || "") as string,
        location: (formData.get("location") || "") as string,
        cvUrl: (formData.get("cvUrl") ||
          formData.get("cv_url") ||
          "") as string,
        source: (formData.get("source") ||
          "PUBLIC_JOB_BOARD") as string | undefined,
      };

      // NOTE:
      // If you're *directly* posting the File here as `cv`,
      // you would handle Supabase upload in this block:
      //
      // const cvFile = formData.get("cv");
      // if (cvFile instanceof File) { ... upload to Supabase and set body.cvUrl ... }
      //
      // Right now we assume the FE already uploads and sends `cvUrl`.
    }
    // 🔹 3) Anything else – try JSON once, then bail
    else {
      try {
        body = (await req.json()) as ApplyBody;
      } catch (err) {
        console.error(
          "Job application endpoint – unsupported content-type + JSON parse failed",
          {
            contentType,
            err,
          }
        );
        return NextResponse.json(
          {
            error:
              "Unsupported request format. Please refresh the page and try again.",
          },
          { status: 400 }
        );
      }
    }

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

    const insertPayload = {
      tenant_id: job.tenant_id,
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
        message:
          "Thank you — we’ve received your application. If there’s a strong match between your experience and this role, we’ll be in touch.",
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("Error in job application endpoint", err);
    return NextResponse.json(
      {
        error:
          "Unexpected error while submitting your application. Please try again in a moment.",
      },
      { status: 500 }
    );
  }
}
