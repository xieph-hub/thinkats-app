// app/api/jobs/[slug]/apply/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServerClient";

type RouteContext = {
  params: {
    slug: string;
  };
};

export async function POST(req: NextRequest, context: RouteContext) {
  const { slug } = context.params;
  const supabase = await createSupabaseServerClient();

  // 1) Find the job by slug OR id in the ATS `jobs` table
  const slugOrId = slug;

  const { data: job, error: jobError } = await supabase
    .from("jobs")
    .select("id, tenant_id, title, status, visibility, slug")
    .or(`id.eq.${slugOrId},slug.eq.${slugOrId}`)
    .maybeSingle();

  if (jobError || !job) {
    console.error("❌ Error finding job in apply route:", {
      jobError,
      slugOrId,
    });
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  // Optional: only allow applications for open/public jobs
  if (
    job.status &&
    !["open", "OPEN", "Open", "active", "ACTIVE"].includes(job.status)
  ) {
    return NextResponse.json(
      { error: "This job is not accepting applications." },
      { status: 400 }
    );
  }

  const contentType = req.headers.get("content-type") ?? "";

  let fullName = "";
  let email = "";
  let phone = "";
  let location = "";
  let linkedinUrl = "";
  let portfolioUrl = "";
  let cvUrl = "";
  let coverLetter = "";
  let source = "careers_site";

  // 2) Parse body (supports JSON and form-data)
  if (contentType.includes("application/json")) {
    const body = (await req.json().catch(() => ({}))) as any;

    fullName = (
      body.fullName ||
      body.full_name ||
      body.name ||
      ""
    )
      .toString()
      .trim();

    email = (body.email || "").toString().trim();

    phone = (
      body.phone ||
      body.phoneNumber ||
      body.phone_number ||
      ""
    )
      .toString()
      .trim();

    location = (body.location || "").toString().trim();

    linkedinUrl = (body.linkedinUrl || body.linkedin_url || "")
      .toString()
      .trim();

    portfolioUrl = (body.portfolioUrl || body.portfolio_url || "")
      .toString()
      .trim();

    cvUrl = (body.cvUrl || body.cv_url || "").toString().trim();

    coverLetter = (body.coverLetter || body.cover_letter || "")
      .toString()
      .trim();

    const src = (body.source || body.referrer || "").toString().trim();
    if (src) {
      source = src;
    }
  } else {
    const formData = await req.formData();

    fullName = (
      formData.get("fullName") ??
      formData.get("full_name") ??
      formData.get("name") ??
      ""
    )
      .toString()
      .trim();

    email = (formData.get("email") ?? "").toString().trim();

    phone = (
      formData.get("phone") ??
      formData.get("phoneNumber") ??
      formData.get("phone_number") ??
      ""
    )
      .toString()
      .trim();

    location = (formData.get("location") ?? "").toString().trim();

    linkedinUrl = (
      formData.get("linkedinUrl") ??
      formData.get("linkedin_url") ??
      ""
    )
      .toString()
      .trim();

    portfolioUrl = (
      formData.get("portfolioUrl") ??
      formData.get("portfolio_url") ??
      ""
    )
      .toString()
      .trim();

    cvUrl = (
      formData.get("cvUrl") ??
      formData.get("cv_url") ??
      ""
    )
      .toString()
      .trim();

    coverLetter = (
      formData.get("coverLetter") ??
      formData.get("cover_letter") ??
      ""
    )
      .toString()
      .trim();

    const srcVal =
      formData.get("source") ?? formData.get("referrer") ?? "";
    if (srcVal) {
      source = srcVal.toString().trim();
    }
  }

  // 3) Basic validation
  if (!fullName || !email) {
    return NextResponse.json(
      { error: "Missing required fields: name and email." },
      { status: 400 }
    );
  }

  // 4) Insert application into job_applications
  // NOTE: stage & status will use DB defaults: 'APPLIED' and 'PENDING'
  const { data: app, error: appError } = await supabase
    .from("job_applications")
    .insert({
      job_id: job.id,
      candidate_id: null, // we can wire this to a candidates table later
      full_name: fullName,
      email,
      phone: phone || null,
      location: location || null,
      linkedin_url: linkedinUrl || null,
      portfolio_url: portfolioUrl || null,
      cv_url: cvUrl || null,
      cover_letter: coverLetter || null,
      source,
      // stage: 'APPLIED', // optional, DB default already set
      // status: 'PENDING', // optional, DB default already set
    })
    .select("id")
    .single();

  if (appError || !app) {
    console.error("❌ Error creating job application:", { appError });
    return NextResponse.json(
      { error: "Failed to submit application. Please try again." },
      { status: 500 }
    );
  }

  // 5) Success
  return NextResponse.json(
    {
      message: "Application received",
      applicationId: app.id,
    },
    { status: 201 }
  );
}
