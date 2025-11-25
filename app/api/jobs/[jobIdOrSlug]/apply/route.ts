// app/api/jobs/[jobIdOrSlug]/apply/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

const CV_BUCKET =
  process.env.NEXT_PUBLIC_SUPABASE_CV_BUCKET || "candidate-cvs";

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value
  );
}

export async function POST(
  req: NextRequest,
  { params }: { params: { jobIdOrSlug: string } }
) {
  try {
    const slugOrId = params.jobIdOrSlug;
    const formData = await req.formData();

    // 1) Resolve job (by jobId in form if present, otherwise by slug/UUID)
    let jobId = (formData.get("jobId") as string | null) || null;

    let jobRow: {
      id: string;
      tenant_id: string | null;
      visibility: string | null;
      status: string | null;
      slug: string | null;
    } | null = null;

    // Try by explicit jobId first
    if (jobId && isUuid(jobId)) {
      const { data, error } = await supabaseAdmin
        .from("jobs")
        .select("id, tenant_id, visibility, status, slug")
        .eq("id", jobId)
        .limit(1)
        .single();

      if (error) {
        console.error("Apply API – error looking up job by id:", error);
      } else {
        jobRow = data;
      }
    }

    // Fallback: use slugOrId
    if (!jobRow) {
      const query = supabaseAdmin
        .from("jobs")
        .select("id, tenant_id, visibility, status, slug")
        .eq(isUuid(slugOrId) ? "id" : "slug", slugOrId)
        .limit(1);

      const { data, error } = await query.single();

      if (error) {
        console.error("Apply API – error looking up job by slugOrId:", error);
      } else {
        jobRow = data;
        jobId = data.id;
      }
    }

    if (!jobRow || !jobId) {
      return NextResponse.json(
        { error: "This role could not be found or is no longer open." },
        { status: 404 }
      );
    }

    // Optional: basic guard so we don’t accept for closed/internal roles
    if (
      jobRow.visibility &&
      jobRow.visibility !== "public" &&
      jobRow.visibility !== "internal"
    ) {
      return NextResponse.json(
        { error: "This role is not accepting public applications." },
        { status: 400 }
      );
    }

    // 2) Extract applicant fields from form
    const full_name = (formData.get("full_name") as string | null)?.trim();
    const email = (formData.get("email") as string | null)?.trim();
    const phone = (formData.get("phone") as string | null)?.trim() || null;
    const location =
      (formData.get("location") as string | null)?.trim() || null;
    const linkedin_url =
      (formData.get("linkedin_url") as string | null)?.trim() || null;
    const cover_letter =
      (formData.get("cover_letter") as string | null)?.trim() || null;

    if (!full_name || !email) {
      return NextResponse.json(
        { error: "Full name and email are required." },
        { status: 400 }
      );
    }

    // 3) Handle CV upload (optional but strongly recommended)
    let cv_url: string | null = null;
    const cvFile = formData.get("cv");

    if (cvFile && cvFile instanceof File && cvFile.size > 0) {
      const originalName = cvFile.name || "cv";
      const ext = originalName.includes(".")
        ? originalName.split(".").pop()
        : "pdf";

      const safeName = originalName
        .toLowerCase()
        .replace(/[^a-z0-9.]+/g, "-")
        .replace(/^-+|-+$/g, "");

      const filePath = `jobs/${jobId}/${Date.now()}-${safeName}`;

      const arrayBuffer = await cvFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const { error: uploadError } = await supabaseAdmin.storage
        .from(CV_BUCKET)
        .upload(filePath, buffer, {
          contentType: cvFile.type || "application/octet-stream",
          upsert: false,
        });

      if (uploadError) {
        console.error("Apply API – error uploading CV:", uploadError);
        return NextResponse.json(
          {
            error:
              "We couldn't upload your CV. Please try again or email your CV directly.",
          },
          { status: 500 }
        );
      }

      const {
        data: { publicUrl },
      } = supabaseAdmin.storage.from(CV_BUCKET).getPublicUrl(filePath);

      cv_url = publicUrl;
    }

    // 4) Insert into job_applications
    const { data: application, error: insertError } = await supabaseAdmin
      .from("job_applications")
      .insert({
        job_id: jobId,
        full_name,
        email,
        phone,
        location,
        linkedin_url,
        cv_url,
        cover_letter,
        source: "public_jobs_page",
        // Let DB defaults handle stage/status, but you *could* set explicitly:
        // stage: "APPLIED",
        // status: "PENDING",
        data_privacy_consent: true,
        terms_consent: true,
        marketing_opt_in: false,
      })
      .select("id, job_id, full_name, email, cv_url, stage, status")
      .single();

    if (insertError || !application) {
      console.error("Apply API – error inserting job application:", insertError);
      return NextResponse.json(
        {
          error:
            "We couldn't submit your application. Please try again or email your CV directly.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        applicationId: application.id,
        jobId: application.job_id,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Apply API – unexpected error:", err);
    return NextResponse.json(
      {
        error:
          "We couldn't submit your application. Please try again or email your CV directly.",
      },
      { status: 500 }
    );
  }
}
