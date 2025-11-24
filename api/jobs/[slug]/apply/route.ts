// app/api/jobs/[slug]/apply/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

// You can override this in your env if your bucket has a different name
const CV_BUCKET =
  process.env.NEXT_PUBLIC_SUPABASE_CV_BUCKET ||
  process.env.SUPABASE_CV_BUCKET ||
  "job-applications";

type JobRecord = {
  id: string;
  slug: string | null;
  tenant_id: string | null;
  status: string | null;
  visibility: string | null;
};

function isUuid(value: string | null | undefined) {
  if (!value) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value
  );
}

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const identifier = params.slug;

    const formData = await req.formData();

    const jobIdRaw = formData.get("jobId");
    const jobId = jobIdRaw ? String(jobIdRaw) : null;

    const fullName = formData.get("full_name")?.toString().trim() || "";
    const email = formData.get("email")?.toString().trim() || "";
    const phone = formData.get("phone")?.toString().trim() || "";
    const location =
      formData.get("location")?.toString().trim() || "";
    const linkedinUrl =
      formData.get("linkedin_url")?.toString().trim() || "";
    const coverLetter =
      formData.get("cover_letter")?.toString().trim() || "";

    if (!fullName || !email) {
      return NextResponse.json(
        { error: "Full name and email are required." },
        { status: 400 }
      );
    }

    // 1) Resolve job via jobId (preferred) or slug fallback
    let job: JobRecord | null = null;

    if (isUuid(jobId)) {
      const { data, error } = await supabaseAdmin
        .from("jobs")
        .select("id, slug, tenant_id, status, visibility")
        .eq("id", jobId)
        .limit(1);

      if (error) {
        console.error("Apply – error querying job by id:", error);
      }
      job = (data?.[0] as JobRecord | undefined) || null;
    }

    if (!job) {
      const { data, error } = await supabaseAdmin
        .from("jobs")
        .select("id, slug, tenant_id, status, visibility")
        .eq("slug", identifier)
        .limit(1);

      if (error) {
        console.error("Apply – error querying job by slug:", error);
      }
      job = (data?.[0] as JobRecord | undefined) || null;
    }

    if (!job) {
      return NextResponse.json(
        { error: "Job not found or no longer available." },
        { status: 404 }
      );
    }

    if (job.visibility !== "public" || job.status !== "open") {
      return NextResponse.json(
        { error: "Applications for this role are currently closed." },
        { status: 400 }
      );
    }

    // 2) Handle CV upload to Supabase Storage (if provided)
    let cvUrl: string | null = null;
    const cvFile = formData.get("cv");

    if (cvFile instanceof File && cvFile.size > 0) {
      try {
        const originalName = cvFile.name || "cv";
        const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, "_");
        const filePath = `job-${job.id}/${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)}-${safeName}`;

        const arrayBuffer = await cvFile.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const { error: uploadError } = await supabaseAdmin.storage
          .from(CV_BUCKET)
          .upload(filePath, buffer, {
            contentType:
              cvFile.type || "application/octet-stream",
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          console.error("Apply – CV upload error:", uploadError);
        } else {
          const { data: publicData } = supabaseAdmin.storage
            .from(CV_BUCKET)
            .getPublicUrl(filePath);

          cvUrl = publicData.publicUrl;
        }
      } catch (uploadErr) {
        console.error("Apply – unexpected CV upload error:", uploadErr);
      }
    }

    // 3) Insert into job_applications, linking job and tenant
    const insertPayload: Record<string, unknown> = {
      job_id: job.id,
      tenant_id: job.tenant_id ?? null,
      full_name: fullName,
      email,
      phone: phone || null,
      location: location || null,
      linkedin_url: linkedinUrl || null,
      cover_letter: coverLetter || null,
      cv_url: cvUrl,
      status: "applied",
      source: "public_job_board",
    };

    const { data: appData, error: appError } = await supabaseAdmin
      .from("job_applications")
      .insert(insertPayload)
      .select("id")
      .single();

    if (appError || !appData) {
      console.error(
        "Apply – error inserting job_application:",
        appError
      );
      return NextResponse.json(
        {
          error:
            "We couldn't submit your application. Please try again or email your CV directly.",
        },
        { status: 500 }
      );
    }

    // 4) Success
    return NextResponse.json(
      {
        ok: true,
        applicationId: appData.id,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Apply – unexpected error:", err);
    return NextResponse.json(
      {
        error:
          "We couldn't submit your application. Please try again or email your CV directly.",
      },
      { status: 500 }
    );
  }
}
