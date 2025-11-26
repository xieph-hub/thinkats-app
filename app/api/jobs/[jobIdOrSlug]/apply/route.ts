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
    let uploadCvFile: File | null = null;

    // 🔹 JSON body (fetch with JSON.stringify)
    if (contentType.includes("application/json")) {
      body = (await req.json()) as ApplyBody;
    }
    // 🔹 Multipart / form-encoded (HTML form with file upload)
    else if (
      contentType.includes("multipart/form-data") ||
      contentType.includes("application/x-www-form-urlencoded")
    ) {
      const formData = await req.formData();

      const possibleJobId =
        (formData.get("jobId") as string | null) ??
        (formData.get("job_id") as string | null) ??
        null;
      const possibleSlug =
        (formData.get("jobSlug") as string | null) ??
        (formData.get("slug") as string | null) ??
        null;

      // capture the file if present (name="cv" is the usual pattern)
      const fileCandidate = formData.get("cv");
      if (fileCandidate instanceof File) {
        uploadCvFile = fileCandidate;
      }

      body = {
        jobId: possibleJobId || undefined,
        jobSlug: possibleSlug || undefined,
        fullName:
          ((formData.get("fullName") ||
            formData.get("full_name") ||
            formData.get("name")) as string | null) ?? "",
        full_name:
          ((formData.get("full_name") ||
            formData.get("fullName") ||
            formData.get("name")) as string | null) ?? "",
        email: ((formData.get("email") as string | null) ?? "").toString(),
        phone: ((formData.get("phone") as string | null) ?? "").toString(),
        location: ((formData.get("location") as string | null) ?? "").toString(),
        cvUrl:
          ((formData.get("cvUrl") ||
            formData.get("cv_url")) as string | null) ?? "",
        cv_url:
          ((formData.get("cv_url") ||
            formData.get("cvUrl")) as string | null) ?? "",
        source:
          ((formData.get("source") as string | null) ??
            "PUBLIC_JOB_BOARD") || undefined,
      };
    }
    // 🔹 Fallback: try JSON once for anything else
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
              "We couldn’t read your application payload. Please refresh the page and try again.",
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
        { error: "Missing job identifier for this application." },
        { status: 400 }
      );
    }

    // 🔹 Resolve job (also validates tenant)
    const job = await resolveJobForCurrentTenant(rawJobId);

    // 🔹 If we received a file but no cvUrl string, upload it to Supabase Storage
    let cvUrlFromUpload: string | null = null;

    if (
      uploadCvFile instanceof File &&
      !body.cvUrl &&
      !body.cv_url
    ) {
      try {
        const originalName = uploadCvFile.name || "cv.pdf";
        const ext = originalName.includes(".")
          ? originalName.split(".").pop()
          : "pdf";

        const rawName =
          (body.fullName ||
            body.full_name ||
            "candidate") as string;

        const safeBase =
          rawName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "") || "candidate";

        const filePath = `cvs/${job.id}/${Date.now()}-${safeBase}.${ext}`;

        const { data: uploadResult, error: uploadError } =
          await supabaseAdmin.storage
            .from("candidate-cvs") // 🔸 make sure you have a bucket named `candidate-cvs`
            .upload(filePath, uploadCvFile, {
              contentType:
                uploadCvFile.type || "application/octet-stream",
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
          .from("candidate-cvs")
          .getPublicUrl(uploadResult.path);

        cvUrlFromUpload = publicUrlData?.publicUrl ?? null;
      } catch (err) {
        console.error("Unexpected error while uploading CV", err);
        return NextResponse.json(
          {
            error:
              "We couldn’t upload your CV right now. Please try again in a moment.",
          },
          { status: 500 }
        );
      }
    }

    const full_name = (body.fullName || body.full_name || "").trim();
    const email = (body.email || "").trim().toLowerCase();
    const phone = (body.phone || "").trim();
    const location = (body.location || "").trim();
    const cv_url = (
      body.cvUrl ||
      body.cv_url ||
      cvUrlFromUpload ||
      ""
    ).trim();
    const source = (body.source || "PUBLIC_JOB_BOARD").trim();

    // 🔹 Friendly validation message
    if (!full_name || !email || !cv_url) {
      return NextResponse.json(
        {
          error:
            "Please add your full name, email address and CV before submitting.",
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
        {
          error:
            "We couldn’t save your application. Please try again in a moment.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        applicationId: data.id as string,
        message:
          "Thank you. Your application has been received. If there’s a strong match with this mandate, we’ll be in touch.",
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("Error in job application endpoint", err);
    return NextResponse.json(
      {
        error:
          "Unexpected error while submitting your application. Please try again shortly.",
      },
      { status: 500 }
    );
  }
}
