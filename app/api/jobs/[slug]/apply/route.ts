// app/api/jobs/[slug]/apply/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServerClient";

export const dynamic = "force-dynamic";

type JobRow = {
  id: string;
  tenant_id: string;
  slug: string | null;
  status: string;
  visibility: string;
};

function getBaseUrl(): string {
  const fromEnv =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    "https://www.resourcin.com";
  if (fromEnv.startsWith("http")) return fromEnv;
  return `https://${fromEnv}`;
}

// Find job by slug, then by id, restricted to open + public
async function findPublicJobForApply(
  supabase: any,
  slugOrId: string
): Promise<JobRow | null> {
  const selectCols = `
    id,
    tenant_id,
    slug,
    status,
    visibility
  `;

  // 1) try by slug
  let { data, error } = await supabase
    .from("jobs")
    .select(selectCols)
    .eq("slug", slugOrId)
    .eq("status", "open")
    .eq("visibility", "public")
    .limit(1);

  if (error) {
    console.error("apply route: error loading job by slug", error);
    throw error;
  }

  if (data && data.length > 0) {
    return data[0] as JobRow;
  }

  // 2) try by id (UUID)
  const { data: byId, error: byIdError } = await supabase
    .from("jobs")
    .select(selectCols)
    .eq("id", slugOrId)
    .eq("status", "open")
    .eq("visibility", "public")
    .limit(1);

  if (byIdError) {
    console.error("apply route: error loading job by id", byIdError);
    throw byIdError;
  }

  if (!byId || byId.length === 0) return null;
  return byId[0] as JobRow;
}

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const slugOrId = decodeURIComponent(params.slug);

  try {
    const supabase = await createSupabaseServerClient();

    const job = await findPublicJobForApply(supabase, slugOrId);
    if (!job) {
      return NextResponse.json(
        { error: "Job not found or not open for applications." },
        { status: 404 }
      );
    }

    const contentType = req.headers.get("content-type") || "";

    let fullName = "";
    let email = "";
    let phone: string | null = null;
    let location: string | null = null;
    let linkedinUrl: string | null = null;
    let portfolioUrl: string | null = null;
    let cvUrl: string | null = null;
    let coverLetter: string | null = null;
    let source: string | null = null;

    // --- JSON payload path (JobApplyForm) ---
    if (contentType.includes("application/json")) {
      const body = (await req.json().catch(() => ({}))) as any;

      fullName = (body.fullName ?? "").toString().trim();
      email = (body.email ?? "").toString().trim();
      phone = (body.phone ?? "").toString().trim() || null;
      location = (body.location ?? "").toString().trim() || null;
      linkedinUrl = (body.linkedinUrl ?? "").toString().trim() || null;
      portfolioUrl = (body.portfolioUrl ?? "").toString().trim() || null;
      cvUrl = (body.cvUrl ?? "").toString().trim() || null;
      // allow headline to flow into coverLetter if you want
      coverLetter =
        (body.coverLetter || body.headline || "").toString().trim() || null;
      source = (body.source ?? "Website").toString();
    } else {
      // --- FormData path (server-rendered <form> POST) ---
      const formData = await req.formData();

      fullName =
        (formData.get("full_name") ||
          formData.get("fullName") ||
          "").toString().trim();
      email = (formData.get("email") || "").toString().trim();
      phone = (formData.get("phone") || "").toString().trim() || null;
      location = (formData.get("location") || "").toString().trim() || null;

      linkedinUrl =
        (formData.get("linkedin_url") ||
          formData.get("linkedinUrl") ||
          "").toString().trim() || null;
      portfolioUrl =
        (formData.get("portfolio_url") ||
          formData.get("portfolioUrl") ||
          "").toString().trim() || null;

      // For classic forms, cvUrl may be sent as a text field (link).
      // File uploads go through /api/upload-cv, which then sends cvUrl in JSON.
      const cvField =
        formData.get("cvUrl") || formData.get("cv_url") || null;
      if (typeof cvField === "string") {
        cvUrl = cvField.trim() || null;
      } else {
        cvUrl = null;
      }

      coverLetter =
        (formData.get("cover_letter") ||
          formData.get("coverLetter") ||
          "").toString().trim() || null;

      source =
        (formData.get("source") || "careers_site").toString() ||
        "careers_site";
    }

    if (!fullName || !email) {
      return NextResponse.json(
        { error: "Full name and email are required." },
        { status: 400 }
      );
    }

    // --- 1) Best-effort candidate record (do not fail the application if this fails) ---
    let candidateId: string | null = null;

    try {
      // Look for existing candidate for this tenant + email
      const { data: existing, error: existingErr } = await supabase
        .from("candidates")
        .select("id")
        .eq("tenant_id", job.tenant_id)
        .eq("email", email)
        .limit(1);

      if (existingErr) {
        console.error(
          "apply route: error looking up existing candidate",
          existingErr
        );
      }

      if (existing && existing.length > 0) {
        candidateId = existing[0].id;
      } else {
        const { data: inserted, error: insertErr } = await supabase
          .from("candidates")
          .insert({
            tenant_id: job.tenant_id,
            full_name: fullName,
            email,
            phone,
            location,
            linkedin_url: linkedinUrl,
            cv_url: cvUrl,
            source: source ?? "Website",
          })
          .select("id")
          .single();

        if (insertErr) {
          console.error(
            "apply route: error inserting candidate (non-fatal)",
            insertErr
          );
        } else if (inserted?.id) {
          candidateId = inserted.id;
        }
      }
    } catch (candidateErr) {
      console.error(
        "apply route: unexpected candidate create error (non-fatal)",
        candidateErr
      );
    }

    // --- 2) Create job_application row, including cv_url ---
    const { data: application, error: appError } = await supabase
      .from("job_applications")
      .insert({
        job_id: job.id,
        candidate_id: candidateId,
        full_name: fullName,
        email,
        phone,
        location,
        linkedin_url: linkedinUrl,
        portfolio_url: portfolioUrl,
        cv_url: cvUrl,
        cover_letter: coverLetter,
        source: source ?? "Website",
        // stage/status default from DB: APPLIED / PENDING
      })
      .select("id")
      .single();

    if (appError || !application) {
      console.error(
        "apply route: error inserting job_application",
        appError
      );
      return NextResponse.json(
        {
          error:
            "Unexpected error while creating your application. Please try again.",
        },
        { status: 500 }
      );
    }

    // --- Response handling ---
    // If request came from a classic HTML form, redirect back to job page with ?applied=1
    if (!contentType.includes("application/json")) {
      const origin = req.headers.get("origin") ?? getBaseUrl();
      const redirectUrl = new URL(
        `/jobs/${encodeURIComponent(slugOrId)}?applied=1`,
        origin
      );
      return NextResponse.redirect(redirectUrl.toString(), 303);
    }

    // JSON clients (JobApplyForm) get JSON
    return NextResponse.json({
      ok: true,
      applicationId: application.id,
    });
  } catch (err) {
    console.error("POST /api/jobs/[slug]/apply unexpected error", err);
    return NextResponse.json(
      {
        error:
          "Unexpected error while creating your application. Please try again.",
      },
      { status: 500 }
    );
  }
}
