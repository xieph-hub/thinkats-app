// app/api/jobs/[slug]/apply/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

// Bucket for CV uploads – update via env if needed
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

    // Expecting multipart/form-data from your public apply form
    const formData = await req.formData();

    // --- Robust field extraction (in case names differ slightly) ---
    const jobIdRaw =
      formData.get("jobId") ||
      formData.get("job_id") ||
      formData.get("job");
    const jobId = jobIdRaw ? String(jobIdRaw) : null;

    const fullNameEntry =
      formData.get("full_name") ||
      formData.get("name") ||
      formData.get("candidate_name");
    const emailEntry =
      formData.get("email") || formData.get("candidate_email");

    const fullName =
      (typeof fullNameEntry === "string"
        ? fullNameEntry
        : fullNameEntry?.toString() || ""
      ).trim();

    const email =
      (typeof emailEntry === "string"
        ? emailEntry
        : emailEntry?.toString() || ""
      ).trim();

    const phoneEntry = formData.get("phone");
    const locationEntry = formData.get("location");

    const phone =
      (typeof phoneEntry === "string"
        ? phoneEntry
        : phoneEntry?.toString() || ""
      ).trim() || null;

    const location =
      (typeof locationEntry === "string"
        ? locationEntry
        : locationEntry?.toString() || ""
      ).trim() || null;

    // Optional extras if you wired them on the form:
    const linkedinEntry =
      formData.get("linkedin_url") || formData.get("linkedin");
    const coverLetterEntry =
      formData.get("cover_letter") || formData.get("message");

    const linkedin_url =
      (typeof linkedinEntry === "string"
        ? linkedinEntry
        : linkedinEntry?.toString() || ""
      ).trim() || null;

    const cover_letter =
      (typeof coverLetterEntry === "string"
        ? coverLetterEntry
        : coverLetterEntry?.toString() || ""
      ).trim() || null;

    if (!fullName || !email) {
      console.error("Apply – missing fullName or email", {
        fullName,
        email,
      });
      return NextResponse.json(
        {
          error:
            "We couldn't submit your application. Please check your details and try again.",
        },
        { status: 400 }
      );
    }

    // --- 1) Resolve job via jobId (preferred) or slug fallback ---
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
      console.error("Apply – job not found for identifier:", {
        identifier,
        jobId,
      });
      return NextResponse.json(
        { error: "Job not found or no longer available." },
        { status: 404 }
      );
    }

    // Optional guard – only allow public + open jobs
    if (job.visibility !== "public" || job.status !== "open") {
      console.error("Apply – job not open/public:", job);
      return NextResponse.json(
        { error: "Applications for this role are currently closed." },
        { status: 400 }
      );
    }

    // --- 2) Handle CV upload to Supabase Storage (if provided) ---
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

    // --- 3) Insert into job_applications, linking to job ---
    // Keep this payload VERY minimal to match your schema.
    // Columns assumed to exist: job_id, full_name, email, phone, location, cv_url, status
    const insertPayload: Record<string, unknown> = {
      job_id: job.id,
      full_name: fullName,
      email,
      status: "applied",
    };

    if (phone) insertPayload.phone = phone;
    if (location) insertPayload.location = location;
    if (cvUrl) insertPayload.cv_url = cvUrl;
    if (linkedin_url) insertPayload.linkedin_url = linkedin_url;
    if (cover_letter) insertPayload.cover_letter = cover_letter;

    const { data: appData, error: appError } = await supabaseAdmin
      .from("job_applications")
      .insert(insertPayload)
      .select("id")
      .single();

    if (appError || !appData) {
      console.error(
        "Apply – error inserting job_application:",
        appError,
        "payload:",
        insertPayload
      );
      return NextResponse.json(
        {
          error:
            "We couldn't submit your application. Please try again or email your CV directly.",
        },
        { status: 500 }
      );
    }

    // --- 4) Success ---
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
