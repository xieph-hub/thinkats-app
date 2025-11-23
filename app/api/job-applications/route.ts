// app/api/job-applications/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const jobId = formData.get("jobId")?.toString();
    const tenantId = formData.get("tenantId")?.toString();
    const jobSlug = formData.get("jobSlug")?.toString() || "";
    const fullName = formData.get("fullName")?.toString();
    const email = formData.get("email")?.toString();
    const phone = formData.get("phone")?.toString() || null;
    const location = formData.get("location")?.toString() || null;
    const linkedinUrl = formData.get("linkedinUrl")?.toString() || null;
    const portfolioUrl = formData.get("portfolioUrl")?.toString() || null;
    const coverLetter = formData.get("coverLetter")?.toString() || null;
    const source = "careers_site";

    if (!jobId || !tenantId || !fullName || !email) {
      console.error("Missing required fields in job application", {
        jobId,
        tenantId,
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

    // TODO: Wire up Supabase storage for CV properly.
    // For now we ignore the file so the flow works end-to-end.
    const cvUrl = null;

    const { data, error } = await supabaseAdmin
      .from("job_applications")
      .insert({
        job_id: jobId,
        tenant_id: tenantId,
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

    // Success → bounce back to job page with success flag
    return NextResponse.redirect(
      new URL(
        `/jobs/${encodeURIComponent(jobSlug || jobId)}?applied=1`,
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
