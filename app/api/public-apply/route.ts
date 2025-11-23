// app/api/public-apply/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STORAGE_BUCKET = "resourcin-uploads";

export async function POST(req: NextRequest) {
  try {
    const supabase = createSupabaseAdminClient();

    const formData = await req.formData();

    const jobId = (formData.get("jobId") || "").toString().trim();
    const fullName = (formData.get("fullName") || "").toString().trim();
    const email = (formData.get("email") || "").toString().trim();
    const phone = (formData.get("phone") || "").toString().trim() || null;
    const location =
      (formData.get("location") || "").toString().trim() || null;
    const linkedinUrl =
      (formData.get("linkedinUrl") || "").toString().trim() || null;
    const portfolioUrl =
      (formData.get("portfolioUrl") || "").toString().trim() || null;
    const coverLetter =
      (formData.get("coverLetter") || "").toString().trim() || null;
    const manualCvUrl =
      (formData.get("cvUrl") || "").toString().trim() || null;

    if (!jobId || !fullName || !email) {
      return NextResponse.json(
        { error: "Job, full name and email are required." },
        { status: 400 }
      );
    }

    // Basic: make sure the job actually exists & is open/public
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("id, status, visibility")
      .eq("id", jobId)
      .eq("status", "open")
      .eq("visibility", "public")
      .single();

    if (jobError || !job) {
      console.error("Public apply: job not found or not open/public", jobError);
      return NextResponse.json(
        { error: "This job is not available for applications." },
        { status: 400 }
      );
    }

    // 1) Upload CV file to Supabase Storage (service role — bypasses RLS)
    let finalCvUrl: string | null = manualCvUrl;

    const cvFile = formData.get("cvFile") as File | null;
    if (cvFile && cvFile.size > 0) {
      try {
        const arrayBuffer = await cvFile.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const safeFileName = cvFile.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
        const path = `cvs/${jobId}/${Date.now()}-${safeFileName}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(STORAGE_BUCKET)
          .upload(path, buffer, {
            cacheControl: "3600",
            upsert: false,
            contentType: cvFile.type || "application/octet-stream",
          });

        if (uploadError || !uploadData) {
          console.error("CV upload error:", uploadError);
        } else {
          const {
            data: { publicUrl },
          } = supabase.storage
            .from(STORAGE_BUCKET)
            .getPublicUrl(uploadData.path);

          if (publicUrl) {
            finalCvUrl = publicUrl;
          }
        }
      } catch (err) {
        console.error("Unexpected error while uploading CV file:", err);
      }
    }

    // 2) Insert into job_applications
    const { data: inserted, error: insertError } = await supabase
      .from("job_applications")
      .insert({
        job_id: jobId,
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

    if (insertError || !inserted) {
      console.error("Error inserting job application:", insertError);
      return NextResponse.json(
        { error: "Could not create application record." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      applicationId: inserted.id,
    });
  } catch (err) {
    console.error("public-apply route unexpected error:", err);
    return NextResponse.json(
      { error: "Unexpected error while creating application." },
      { status: 500 }
    );
  }
}
