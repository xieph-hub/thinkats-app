// app/api/public/jobs/[slug]/apply/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const slugOrId = params.slug;
    const formData = await req.formData();

    const fullName = (formData.get("fullName") || "").toString().trim();
    const email = (formData.get("email") || "").toString().trim();

    if (!fullName || !email) {
      return NextResponse.json(
        { error: "Full name and email are required." },
        { status: 400 }
      );
    }

    const phone = (formData.get("phone") || "").toString().trim() || null;
    const location =
      (formData.get("location") || "").toString().trim() || null;
    const linkedinUrl =
      (formData.get("linkedinUrl") || "").toString().trim() || null;
    const portfolioUrl =
      (formData.get("portfolioUrl") || "").toString().trim() || null;
    const cvUrlField =
      (formData.get("cvUrl") || "").toString().trim() || null;
    const coverLetter =
      (formData.get("coverLetter") || "").toString().trim() || null;

    const supabase = createSupabaseAdminClient();

    // ---- 1) Find the job (open + public, by slug or id) ----
    const selectCols = `
      id,
      slug,
      status,
      visibility
    `;

    let { data: bySlug, error: slugError } = await supabase
      .from("jobs")
      .select(selectCols)
      .eq("slug", slugOrId)
      .eq("status", "open")
      .eq("visibility", "public")
      .limit(1);

    if (slugError) {
      console.error("Error querying job by slug:", slugError);
    }

    let jobRow = bySlug?.[0];

    if (!jobRow) {
      const { data: byId, error: idError } = await supabase
        .from("jobs")
        .select(selectCols)
        .eq("id", slugOrId)
        .eq("status", "open")
        .eq("visibility", "public")
        .limit(1);

      if (idError) {
        console.error("Error querying job by id:", idError);
      }

      jobRow = byId?.[0];
    }

    if (!jobRow) {
      return NextResponse.json(
        { error: "Job not found or not open/public." },
        { status: 404 }
      );
    }

    const jobId = jobRow.id as string;

    // ---- 2) Upsert candidate by email ----
    const { data: existingCandidate, error: candidateError } = await supabase
      .from("candidates")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (candidateError) {
      console.error("Error loading candidate:", candidateError);
    }

    let candidateId: string | null = existingCandidate?.id ?? null;

    if (!candidateId) {
      const { data: insertedCandidate, error: insertCandidateError } =
        await supabase
          .from("candidates")
          .insert({
            email,
            full_name: fullName,
            phone,
            location,
            linkedin_url: linkedinUrl,
            portfolio_url: portfolioUrl,
          })
          .select("id")
          .single();

      if (insertCandidateError) {
        console.error("Error inserting candidate:", insertCandidateError);
      } else {
        candidateId = insertedCandidate?.id ?? null;
      }
    }

    // ---- 3) Handle CV upload (optional file) ----
    let finalCvUrl: string | null = cvUrlField;

    const file = formData.get("cvFile") as File | null;

    if (file && file.size > 0) {
      try {
        const ext =
          file.name.includes(".") ? file.name.split(".").pop() : "pdf";
        const safeEmail = email.replace(/[^a-zA-Z0-9]/g, "_") || "anonymous";
        const path = `cvs/${jobId}/${safeEmail}-${Date.now()}.${ext}`;

        const { data: uploadData, error: uploadError } =
          await supabase.storage
            .from("resourcin-uploads")
            .upload(path, file, {
              cacheControl: "3600",
              upsert: false,
            });

        if (uploadError || !uploadData) {
          console.error("Supabase CV upload error:", uploadError);
        } else {
          const {
            data: { publicUrl },
          } = supabase.storage
            .from("resourcin-uploads")
            .getPublicUrl(uploadData.path);

          finalCvUrl = publicUrl;
        }
      } catch (uploadErr) {
        console.error("Unexpected CV upload error:", uploadErr);
        // we do NOT block the application if upload fails – they might have a link
      }
    }

    // ---- 4) Insert job_application ----
    const { data: application, error: appError } = await supabase
      .from("job_applications")
      .insert({
        job_id: jobId,
        candidate_id: candidateId,
        full_name: fullName,
        email,
        phone,
        location,
        linkedin_url: linkedinUrl,
        portfolio_url: portfolioUrl,
        cv_url: finalCvUrl,
        cover_letter: coverLetter,
        source: "careers_site",
        stage: "APPLIED",
        status: "PENDING",
      })
      .select("id")
      .single();

    if (appError) {
      console.error("Error inserting job_application:", appError);
      return NextResponse.json(
        {
          error:
            "Unexpected error while creating your application. Please try again.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        applicationId: application.id,
        message:
          "Thank you for your interest in the role. Your application has been received.",
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("public job apply API error:", err);
    return NextResponse.json(
      { error: "Unexpected error while submitting application." },
      { status: 500 }
    );
  }
}
