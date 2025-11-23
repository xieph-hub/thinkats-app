// app/api/job-applications/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { Buffer } from "buffer";

export const runtime = "nodejs";

const BUCKET_NAME = "resourcin-uploads";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const jobId = formData.get("jobId")?.toString();
    const jobSlug = formData.get("jobSlug")?.toString() || "";
    const fullName = formData.get("fullName")?.toString();
    const email = formData.get("email")?.toString();
    const phone = formData.get("phone")?.toString() || null;
    const location = formData.get("location")?.toString() || null;
    const linkedinUrl = formData.get("linkedinUrl")?.toString() || null;
    const portfolioUrl = formData.get("portfolioUrl")?.toString() || null;
    const coverLetter = formData.get("coverLetter")?.toString() || null;
    const source = "careers_site";

    const cvFile = formData.get("cv") as File | null;

    if (!jobId || !fullName || !email) {
      console.error("Missing required fields in job application", {
        jobId,
        fullName,
        email,
      });
      return NextResponse.redirect(
        new URL(
          `/jobs/${encodeURIComponent(jobSlug || jobId)}?applied=0`,
          req.url
        )
      );
    }

    // --- CV upload to Supabase Storage (resourcin-uploads bucket) ---
    let cvUrl: string | null = null;

    if (cvFile && cvFile.size > 0) {
      try {
        const arrayBuffer = await cvFile.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const safeName = cvFile.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
        const filePath = `cv-uploads/${jobId}/${Date.now()}-${safeName}`;

        const { error: uploadError } = await supabaseAdmin.storage
          .from(BUCKET_NAME)
          .upload(filePath, buffer, {
            contentType: cvFile.type || "application/octet-stream",
          });

        if (uploadError) {
          console.error("Error uploading CV to storage", uploadError);
        } else {
          const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
          if (baseUrl) {
            cvUrl = `${baseUrl}/storage/v1/object/public/${BUCKET_NAME}/${filePath}`;
          } else {
            cvUrl = filePath;
          }
        }
      } catch (err) {
        console.error("Unexpected error processing CV file", err);
      }
    }

    // --- Insert application row (no tenant_id) ---
    const { data, error } = await supabaseAdmin
      .from("job_applications")
      .insert({
        job_id: jobId,
        full_name: fullName,
        email,
        phone,
        location,
        linkedin_url: linkedinUrl,
        portfolio_url: portfolioUrl,
        cover_letter: coverLetter,
        cv_url: cvUrl,
        source,
        stage: "applied",
        status: "active",
      })
      .select("id")
      .single();

    if (error || !data) {
      console.error("Error inserting job_application", error);
      return NextResponse.redirect(
        new URL(
          `/jobs/${encodeURIComponent(jobSlug || jobId)}?applied=0`,
          req.url
        )
      );
    }

    // ✅ Success → go to clean thank-you page
    return NextResponse.redirect(
      new URL(
        `/jobs/${encodeURIComponent(jobSlug || jobId)}/applied`,
        req.url
      )
    );
  } catch (err) {
    console.error("Unexpected error in job application handler", err);
    return NextResponse.redirect(
      new URL("/jobs?applied=0", req.url)
    );
  }
}
