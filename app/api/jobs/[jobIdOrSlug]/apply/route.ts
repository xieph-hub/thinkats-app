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

// Resolve job within the current tenant by id or slug
async function resolveJobForCurrentTenant(jobIdOrSlug: string) {
  const tenantId = await getCurrentTenantId();

  if (!tenantId) {
    throw new Error("No current tenant id");
  }

  // Try by id first
  let { data: job, error } = await supabaseAdmin
    .from("jobs")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("id", jobIdOrSlug)
    .single();

  if (!job || error) {
    // Fallback to slug
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
    const contentType = req.headers.get("content-type") || "";
    let body: ApplyBody = {};
    let uploadCvFile: File | null = null;

    // 1) Support both JSON and multipart/form-data
    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();

      body = {
        jobId: (form.get("jobId") as string) || undefined,
        job_id: (form.get("job_id") as string) || undefined,
        jobSlug: (form.get("jobSlug") as string) || undefined,
        slug: (form.get("slug") as string) || undefined,
        fullName: (form.get("fullName") as string) || undefined,
        full_name: (form.get("full_name") as string) || undefined,
        email: (form.get("email") as string) || undefined,
        phone: (form.get("phone") as string) || undefined,
        location: (form.get("location") as string) || undefined,
        cvUrl: (form.get("cvUrl") as string) || undefined,
        cv_url: (form.get("cv_url") as string) || undefined,
        source: (form.get("source") as string) || undefined,
      };

      const maybeFile = form.get("cv");
      if (maybeFile instanceof File) {
        uploadCvFile = maybeFile;
      }
    } else {
      // JSON callers (no file upload)
      body = (await req.json()) as ApplyBody;
    }

    // 2) Resolve which job we’re applying to
    const rawJobId =
      body.jobId ||
      body.job_id ||
      body.jobSlug ||
      body.slug ||
      params.jobIdOrSlug;

    if (!rawJobId) {
      return NextResponse.json(
        { error: "Missing job identifier." },
        { status: 400 }
      );
    }

    const job = await resolveJobForCurrentTenant(rawJobId);

    // 3) If there is a file but no URL, upload to Supabase Storage
    let cvUrlFromUpload: string | null = null;

    if (uploadCvFile && !body.cvUrl && !body.cv_url) {
      const originalName = uploadCvFile.name || "cv";
      const safeName = originalName.toLowerCase().replace(/[^a-z0-9.]/g, "-");
      const timestamp = Date.now();
      const filePath = `cvs/${job.id}/${timestamp}-${safeName}`;

      const { data: uploadResult, error: uploadError } =
        await supabaseAdmin.storage
          .from("resourcin-uploads") // ✅ your bucket
          .upload(filePath, uploadCvFile, {
            contentType: uploadCvFile.type || "application/octet-stream",
            upsert: false,
          });

      if (uploadError || !uploadResult) {
        console.error("Error uploading CV to storage", uploadError);
        return NextResponse.json(
          {
            error:
              "We couldn’t upload your CV. Please try again in a moment.",
          },
          { status: 500 }
        );
      }

      const { data: publicUrlData } = supabaseAdmin.storage
        .from("resourcin-uploads")
        .getPublicUrl(uploadResult.path);

      cvUrlFromUpload = publicUrlData?.publicUrl ?? null;
    }

    // 4) Normalise fields
    const full_name = (body.fullName || body.full_name || "").trim();
    const email = (body.email || "").trim().toLowerCase();
    const phone = (body.phone || "").trim();
    const location = (body.location || "").trim();
    const cv_url =
      (body.cvUrl || body.cv_url || "").trim() || cvUrlFromUpload || "";
    const source = (body.source || "PUBLIC_JOB_BOARD").trim();

    if (!full_name || !email || !cv_url) {
      return NextResponse.json(
        {
          error:
            "Please add your name, email and CV before submitting your application.",
        },
        { status: 400 }
      );
    }

    // 5) Insert into job_applications (no tenant_id column here)
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
        {
          error:
            "We couldn’t submit your application due to a temporary issue. Please try again shortly.",
        },
        { status: 500 }
      );
    }

    // 6) Success response (keep your nice front-end copy)
    return NextResponse.json(
      {
        applicationId: data.id as string,
        message:
          "Thank you. Your application has been received. We’ll be in touch if there’s a strong match.",
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("Error in job application endpoint", err);
    return NextResponse.json(
      {
        error:
          "We couldn’t submit your application right now. Please try again, or email your CV to hello@resourcin.com.",
      },
      { status: 500 }
    );
  }
}
