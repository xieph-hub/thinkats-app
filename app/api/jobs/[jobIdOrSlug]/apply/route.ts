// app/api/jobs/[jobIdOrSlug]/apply/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

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
    const identifier = params.jobIdOrSlug;

    const formData = await req.formData();

    // --- 1) Resolve job by slug, then by id (UUID) ---
    let jobId: string | null = null;
    let jobSlug: string | null = null;

    const { data: slugRow, error: slugError } = await supabaseAdmin
      .from("jobs")
      .select("id, slug, status")
      .eq("slug", identifier)
      .limit(1)
      .maybeSingle();

    if (slugError) {
      console.error("Apply API – error looking up job by slug:", slugError);
    }

    if (slugRow?.id) {
      jobId = slugRow.id as string;
      jobSlug = (slugRow.slug as string | null) ?? null;
    }

    if (!jobId && isUuid(identifier)) {
      const { data: idRow, error: idError } = await supabaseAdmin
        .from("jobs")
        .select("id, slug, status")
        .eq("id", identifier)
        .limit(1)
        .maybeSingle();

      if (idError) {
        console.error("Apply API – error looking up job by id:", idError);
      }

      if (idRow?.id) {
        jobId = idRow.id as string;
        jobSlug = (idRow.slug as string | null) ?? null;
      }
    }

    if (!jobId) {
      return NextResponse.json(
        { error: "This role is no longer available or cannot be found." },
        { status: 404 }
      );
    }

    // --- 2) Extract form fields ---
    const fullName = (formData.get("full_name") ?? "").toString().trim();
    const email = (formData.get("email") ?? "").toString().trim();

    if (!fullName || !email) {
      return NextResponse.json(
        { error: "Full name and email are required." },
        { status: 400 }
      );
    }

    const phone = (formData.get("phone") ?? "").toString().trim() || null;
    const location = (formData.get("location") ?? "").toString().trim() || null;
    const linkedinUrl =
      (formData.get("linkedin_url") ?? "").toString().trim() || null;
    const portfolioUrl =
      (formData.get("portfolio_url") ?? "").toString().trim() || null;
    const githubUrl =
      (formData.get("github_url") ?? "").toString().trim() || null;
    const coverLetter =
      (formData.get("cover_letter") ?? "").toString().trim() || null;
    const howHeard =
      (formData.get("how_heard") ?? "").toString().trim() || null;

    const source =
      (formData.get("source") ?? "").toString().trim() ||
      "public_job_site";

    // --- 3) Handle CV upload to resourcin-uploads bucket ---
    let cvUrl: string | null = null;

    const cvFile = formData.get("cv");
    if (cvFile instanceof File && cvFile.size > 0) {
      const originalName = cvFile.name || "cv.pdf";
      const safeName = originalName
        .toLowerCase()
        .replace(/[^a-z0-9.]+/g, "-")
        .replace(/^-+|-+$/g, "");
      const timestamp = Date.now();
      const path = `cv-uploads/${jobId}/${timestamp}-${safeName}`;

      const { error: uploadError } = await supabaseAdmin.storage
        .from("resourcin-uploads")
        .upload(path, cvFile, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        console.error("Apply API – error uploading CV:", uploadError);
        // We still allow the application to be created, just without cv_url.
      } else {
        const {
          data: { publicUrl },
        } = supabaseAdmin.storage
          .from("resourcin-uploads")
          .getPublicUrl(path);

        cvUrl = publicUrl || null;
      }
    }

    // --- 4) Insert into job_applications table ---
    const insertPayload = {
      job_id: jobId,
      candidate_id: null, // you can attach to a talent network later
      full_name: fullName,
      email,
      phone,
      location,
      linkedin_url: linkedinUrl,
      portfolio_url: portfolioUrl,
      github_url: githubUrl,
      cv_url: cvUrl,
      cover_letter: coverLetter,
      source,
      stage: "APPLIED",
      status: "PENDING",
      how_heard: howHeard,
      data_privacy_consent: true,
      terms_consent: true,
      marketing_opt_in: false,
    };

    const { data: appRow, error: appError } = await supabaseAdmin
      .from("job_applications")
      .insert(insertPayload)
      .select("id")
      .single();

    if (appError || !appRow) {
      console.error("Apply API – error inserting job_application:", appError);
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
        ok: true,
        applicationId: appRow.id,
        jobId,
        jobSlug,
        message: "Thank you. Your application has been received.",
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
