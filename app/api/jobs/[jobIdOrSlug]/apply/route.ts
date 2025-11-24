// app/api/jobs/[jobIdOrSlug]/apply/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value
  );
}

// Small helper to normalise booleans coming from forms / JSON
function toBool(val: unknown): boolean | null {
  if (typeof val === "boolean") return val;
  if (typeof val === "string") {
    const v = val.trim().toLowerCase();
    if (["true", "1", "yes", "on"].includes(v)) return true;
    if (["false", "0", "no", "off"].includes(v)) return false;
  }
  return null;
}

export async function POST(
  req: NextRequest,
  { params }: { params: { jobIdOrSlug: string } }
) {
  try {
    const identifier = params.jobIdOrSlug;

    // 1) Resolve job by slug or id (only public jobs)
    const baseSelect = `
      id,
      slug,
      visibility,
      tenant_id
    `;

    let jobId: string | null = null;

    if (isUuid(identifier)) {
      const { data, error } = await supabaseAdmin
        .from("jobs")
        .select(baseSelect)
        .eq("id", identifier)
        .eq("visibility", "public")
        .limit(1);

      if (error) {
        console.error("Apply route – error looking up job by id:", error);
      }

      if (data && data.length > 0) {
        jobId = data[0].id as string;
      }
    } else {
      const { data, error } = await supabaseAdmin
        .from("jobs")
        .select(baseSelect)
        .eq("slug", identifier)
        .eq("visibility", "public")
        .limit(1);

      if (error) {
        console.error("Apply route – error looking up job by slug:", error);
      }

      if (data && data.length > 0) {
        jobId = data[0].id as string;
      }
    }

    if (!jobId) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // 2) Parse body (support JSON and multipart/form-data)
    const contentType = req.headers.get("content-type") || "";
    let raw: Record<string, unknown> = {};

    if (contentType.includes("application/json")) {
      raw = (await req.json()) as Record<string, unknown>;
    } else if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      raw = {
        fullName: form.get("fullName") ?? form.get("full_name"),
        email: form.get("email"),
        phone: form.get("phone"),
        location: form.get("location"),
        linkedinUrl: form.get("linkedinUrl") ?? form.get("linkedin_url"),
        portfolioUrl: form.get("portfolioUrl") ?? form.get("portfolio_url"),
        cvUrl: form.get("cvUrl") ?? form.get("cv_url"),
        coverLetter: form.get("coverLetter") ?? form.get("cover_letter"),
        workPermitStatus:
          form.get("workPermitStatus") ?? form.get("work_permit_status"),
        grossAnnualExpectation:
          form.get("grossAnnualExpectation") ??
          form.get("gross_annual_expectation"),
        currentGrossAnnual:
          form.get("currentGrossAnnual") ??
          form.get("current_gross_annual"),
        noticePeriod: form.get("noticePeriod") ?? form.get("notice_period"),
        githubUrl: form.get("githubUrl") ?? form.get("github_url"),
        howHeard: form.get("howHeard") ?? form.get("how_heard"),
        dataPrivacyConsent:
          form.get("dataPrivacyConsent") ?? form.get("data_privacy_consent"),
        termsConsent: form.get("termsConsent") ?? form.get("terms_consent"),
        marketingOptIn:
          form.get("marketingOptIn") ?? form.get("marketing_opt_in"),
        referenceCode:
          form.get("referenceCode") ?? form.get("reference_code"),
        gender: form.get("gender"),
        ethnicity: form.get("ethnicity"),
        screeningAnswers:
          form.get("screeningAnswers") ?? form.get("screening_answers"),
        source: form.get("source"),
      };
      // NOTE: If you ever want to upload the raw file here instead of using /api/upload-cv,
      // you'd grab form.get("cv") as File and push it to Supabase Storage.
    } else {
      return NextResponse.json(
        { error: "Unsupported content type" },
        { status: 400 }
      );
    }

    // 3) Required fields
    const fullName = (raw.fullName as string | undefined)?.toString().trim();
    const email = (raw.email as string | undefined)?.toString().trim();

    if (!fullName || !email) {
      return NextResponse.json(
        { error: "Full name and email are required." },
        { status: 400 }
      );
    }

    // 4) Optional / enrichment fields
    const phone =
      (raw.phone as string | undefined)?.toString().trim() || null;
    const location =
      (raw.location as string | undefined)?.toString().trim() || null;
    const linkedinUrl =
      (raw.linkedinUrl as string | undefined)?.toString().trim() ||
      (raw.linkedin_url as string | undefined)?.toString().trim() ||
      null;
    const portfolioUrl =
      (raw.portfolioUrl as string | undefined)?.toString().trim() ||
      (raw.portfolio_url as string | undefined)?.toString().trim() ||
      null;
    const cvUrl =
      (raw.cvUrl as string | undefined)?.toString().trim() ||
      (raw.cv_url as string | undefined)?.toString().trim() ||
      null;
    const coverLetter =
      (raw.coverLetter as string | undefined)?.toString().trim() ||
      (raw.cover_letter as string | undefined)?.toString().trim() ||
      null;
    const workPermitStatus =
      (raw.workPermitStatus as string | undefined)?.toString().trim() ||
      (raw.work_permit_status as string | undefined)?.toString().trim() ||
      null;
    const grossAnnualExpectation =
      (raw.grossAnnualExpectation as string | undefined)
        ?.toString()
        .trim() ||
      (raw.gross_annual_expectation as string | undefined)
        ?.toString()
        .trim() ||
      null;
    const currentGrossAnnual =
      (raw.currentGrossAnnual as string | undefined)?.toString().trim() ||
      (raw.current_gross_annual as string | undefined)?.toString().trim() ||
      null;
    const noticePeriod =
      (raw.noticePeriod as string | undefined)?.toString().trim() ||
      (raw.notice_period as string | undefined)?.toString().trim() ||
      null;
    const githubUrl =
      (raw.githubUrl as string | undefined)?.toString().trim() ||
      (raw.github_url as string | undefined)?.toString().trim() ||
      null;
    const howHeard =
      (raw.howHeard as string | undefined)?.toString().trim() ||
      (raw.how_heard as string | undefined)?.toString().trim() ||
      null;
    const referenceCode =
      (raw.referenceCode as string | undefined)?.toString().trim() ||
      (raw.reference_code as string | undefined)?.toString().trim() ||
      null;
    const gender =
      (raw.gender as string | undefined)?.toString().trim() || null;
    const ethnicity =
      (raw.ethnicity as string | undefined)?.toString().trim() || null;
    const source =
      (raw.source as string | undefined)?.toString().trim() ||
      "public_jobs_page";

    // screening_answers is jsonb – accept object or JSON string
    let screeningAnswers: unknown = null;
    if (raw.screeningAnswers ?? raw.screening_answers) {
      const val =
        raw.screeningAnswers ?? raw.screening_answers;
      if (typeof val === "string") {
        try {
          screeningAnswers = JSON.parse(val);
        } catch {
          screeningAnswers = { raw: val };
        }
      } else {
        screeningAnswers = val;
      }
    }

    const dataPrivacyConsent = toBool(
      raw.dataPrivacyConsent ?? raw.data_privacy_consent
    );
    const termsConsent = toBool(
      raw.termsConsent ?? raw.terms_consent
    );
    const marketingOptIn = toBool(
      raw.marketingOptIn ?? raw.marketing_opt_in
    );

    // 5) Build insert payload to match job_applications schema exactly
    const insertPayload = {
      job_id: jobId,
      // candidate_id is nullable and not used yet – leave null for now
      candidate_id: null,
      full_name: fullName,
      email,
      phone,
      location,
      linkedin_url: linkedinUrl,
      portfolio_url: portfolioUrl,
      cv_url: cvUrl,
      cover_letter: coverLetter,
      source,
      // let stage/status defaults kick in, unless you want to override:
      // stage: 'APPLIED',
      // status: 'PENDING',
      work_permit_status: workPermitStatus,
      gross_annual_expectation: grossAnnualExpectation,
      current_gross_annual: currentGrossAnnual,
      notice_period: noticePeriod,
      github_url: githubUrl,
      screening_answers: screeningAnswers,
      gender,
      ethnicity,
      how_heard: howHeard,
      data_privacy_consent: dataPrivacyConsent,
      terms_consent: termsConsent,
      marketing_opt_in: marketingOptIn,
      reference_code: referenceCode,
      // status_note and status_changed_at will be managed later when you move them in the pipeline
    };

    const { data, error } = await supabaseAdmin
      .from("job_applications")
      .insert(insertPayload)
      .select("id")
      .single();

    if (error || !data) {
      console.error("Error inserting job_application:", error);
      return NextResponse.json(
        { error: "Failed to submit application" },
        { status: 500 }
      );
    }

    return NextResponse.json({ applicationId: data.id }, { status: 201 });
  } catch (err) {
    console.error("Unexpected error in public job apply route:", err);
    return NextResponse.json(
      { error: "Unexpected error" },
      { status: 500 }
    );
  }
}
