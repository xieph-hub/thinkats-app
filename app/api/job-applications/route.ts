// app/api/job-applications/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { Buffer } from "buffer";

export const runtime = "nodejs";

const BUCKET_NAME = "resourcin-uploads";

function generateReferenceCode(jobId: string) {
  const prefix = jobId.replace(/-/g, "").slice(0, 8).toUpperCase();
  const ts = Date.now().toString(36).toUpperCase();
  return `REF-${prefix}-${ts}`;
}

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
    const githubUrl = formData.get("githubUrl")?.toString() || null;

    const coverLetter = formData.get("coverLetter")?.toString() || null;

    const workPermitStatus =
      formData.get("workPermitStatus")?.toString() || null;
    const grossAnnualExpectation =
      formData.get("grossAnnualExpectation")?.toString() || null;
    const currentGrossAnnual =
      formData.get("currentGrossAnnual")?.toString() || null;
    const noticePeriod =
      formData.get("noticePeriod")?.toString() || null;

    const gender = formData.get("gender")?.toString() || null;
    const ethnicity = formData.get("ethnicity")?.toString() || null;
    const howHeard = formData.get("howHeard")?.toString() || null;

    const dataPrivacyConsent =
      formData.get("dataPrivacyConsent") === "on";
    const termsConsent = formData.get("termsConsent") === "on";
    const marketingOptIn = formData.get("marketingOptIn") === "on";

    const source = "careers_site";

    const cvFile = formData.get("cv") as File | null;

    // Basic required checks (aligning with spec)
    if (!jobId || !fullName || !email || !cvFile) {
      console.error("Missing required fields in job application", {
        jobId,
        fullName,
        email,
        hasCv: !!cvFile,
      });
      return NextResponse.redirect(
        new URL(
          `/jobs/${encodeURIComponent(jobSlug || jobId)}?applied=0`,
          req.url
        )
      );
    }

    if (!dataPrivacyConsent || !termsConsent) {
      console.error(
        "Missing data privacy or terms consent",
        dataPrivacyConsent,
        termsConsent
      );
      return NextResponse.redirect(
        new URL(
          `/jobs/${encodeURIComponent(jobSlug || jobId)}?applied=0`,
          req.url
        )
      );
    }

    // --- CV upload to Supabase Storage (PDF, max 5MB) ---
    let cvUrl: string | null = null;

    try {
      if (cvFile && cvFile.size > 0) {
        if (cvFile.size > 5 * 1024 * 1024) {
          console.error("CV too large (over 5MB)");
          return NextResponse.redirect(
            new URL(
              `/jobs/${encodeURIComponent(jobSlug || jobId)}?applied=0`,
              req.url
            )
          );
        }

        const arrayBuffer = await cvFile.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const safeName = cvFile.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
        const filePath = `cv-uploads/${jobId}/${Date.now()}-${safeName}`;

        const { error: uploadError } = await supabaseAdmin.storage
          .from(BUCKET_NAME)
          .upload(filePath, buffer, {
            contentType: cvFile.type || "application/pdf",
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
      }
    } catch (err) {
      console.error("Unexpected error processing CV file", err);
    }

    const referenceCode = generateReferenceCode(jobId);

    // Optional place to capture some screening answers as JSON if you want later:
    const screeningAnswers: Record<string, unknown> = {
      work_permit_status: workPermitStatus,
      expected_salary: grossAnnualExpectation,
      current_gross: currentGrossAnnual,
      notice_period: noticePeriod,
    };

    // --- Insert application row ---
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
        github_url: githubUrl,
        cover_letter: coverLetter,
        cv_url: cvUrl,
        source,
        stage: "applied",
        status: "active",
        work_permit_status: workPermitStatus,
        gross_annual_expectation: grossAnnualExpectation,
        current_gross_annual: currentGrossAnnual,
        notice_period: noticePeriod,
        gender,
        ethnicity,
        how_heard: howHeard,
        data_privacy_consent: dataPrivacyConsent,
        terms_consent: termsConsent,
        marketing_opt_in: marketingOptIn,
        reference_code: referenceCode,
        screening_answers: screeningAnswers,
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

    // ✅ Success – keep using the clean /applied page you liked earlier
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
