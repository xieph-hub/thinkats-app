// app/api/job-applications/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { Buffer } from "buffer";

export const runtime = "nodejs";

const CV_BUCKET =
  process.env.SUPABASE_CV_BUCKET || "job-applications-cv"; // create this bucket in Supabase

export async function POST(req: NextRequest) {
  const formData = await req.formData();

  const jobId = formData.get("jobId")?.toString();
  const tenantIdFromForm = formData.get("tenantId")?.toString();
  const fullName = formData.get("fullName")?.toString() ?? "";
  const email = formData.get("email")?.toString() ?? "";
  const phone = formData.get("phone")?.toString() || null;
  const location = formData.get("location")?.toString() || null;
  const linkedinUrl = formData.get("linkedinUrl")?.toString() || null;
  const portfolioUrl = formData.get("portfolioUrl")?.toString() || null;
  const coverLetter = formData.get("coverLetter")?.toString() || null;
  const cvFile = formData.get("cv") as File | null;

  if (!jobId || !fullName || !email) {
    return NextResponse.json(
      { error: "Missing required fields." },
      { status: 400 }
    );
  }

  // Confirm job exists and belongs to tenant
  const { data: jobRow, error: jobError } = await supabaseAdmin
    .from("jobs")
    .select("id, slug, tenant_id")
    .eq("id", jobId)
    .limit(1)
    .single();

  if (jobError || !jobRow) {
    console.error("job-applications: job not found", jobError);
    return NextResponse.json({ error: "Job not found." }, { status: 404 });
  }

  const tenantId = jobRow.tenant_id || tenantIdFromForm || null;

  // ---- Upload CV to Supabase Storage (optional) ----
  let cvUrl: string | null = null;

  if (cvFile && cvFile.size > 0) {
    try {
      const arrayBuffer = await cvFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const path = `${tenantId ?? "no-tenant"}/${jobRow.id}/${
        Date.now() 
      }-${cvFile.name}`;

      const { data: stored, error: uploadError } = await supabaseAdmin.storage
        .from(CV_BUCKET)
        .upload(path, buffer, {
          contentType: cvFile.type || "application/octet-stream",
          upsert: false,
        });

      if (uploadError) {
        console.error("job-applications: CV upload error", uploadError);
      } else if (stored) {
        const { data: publicUrlData } = supabaseAdmin.storage
          .from(CV_BUCKET)
          .getPublicUrl(stored.path);

        cvUrl = publicUrlData.publicUrl;
      }
    } catch (err) {
      console.error("job-applications: exception uploading CV", err);
    }
  }

  // ---- Insert into job_applications ----
  const insertPayload: Record<string, any> = {
    job_id: jobRow.id,
    full_name: fullName,
    email,
    phone,
    location,
    linkedin_url: linkedinUrl,
    portfolio_url: portfolioUrl,
    cv_url: cvUrl,
    cover_letter: coverLetter,
    source: "careers_site",
    stage: "applied", // matches your ATS pipeline semantics
    status: "active",
  };

  if (tenantId) {
    insertPayload.tenant_id = tenantId;
  }

  const { error: insertError } = await supabaseAdmin
    .from("job_applications")
    .insert(insertPayload);

  let appliedFlag = "1";

  if (insertError) {
    appliedFlag = "0";
    console.error("job-applications: error inserting application", insertError);
  }

  const slugOrId = jobRow.slug || jobRow.id;
  const redirectUrl = new URL(
    `/jobs/${encodeURIComponent(slugOrId)}?applied=${appliedFlag}`,
    req.nextUrl.origin
  );

  return NextResponse.redirect(redirectUrl);
}
