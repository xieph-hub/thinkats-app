// app/api/job-applications/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

const BUCKET_NAME = "resourcin-uploads";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const jobId = formData.get("jobId")?.toString();
    const tenantId = formData.get("tenantId")?.toString();
    const jobSlug = formData.get("jobSlug")?.toString() || "";

    if (!jobId || !tenantId) {
      console.error("job-applications: missing jobId or tenantId", {
        jobId,
        tenantId,
      });
      return redirectWithFlag(req.url, jobSlug || jobId || null, 0);
    }

    const fullName = formData.get("fullName")?.toString().trim() || "";
    const email = formData.get("email")?.toString().trim() || "";
    const phone = formData.get("phone")?.toString().trim() || "";
    const location = formData.get("location")?.toString().trim() || "";
    const linkedinUrl = formData.get("linkedinUrl")?.toString().trim() || "";
    const portfolioUrl = formData.get("portfolioUrl")?.toString().trim() || "";
    const coverLetter = formData.get("coverLetter")?.toString().trim() || "";

    // Extra screening fields – we won't store them in separate columns yet,
    // we'll just append into cover_letter text so nothing is lost.
    const hasWorkPermit = formData.get("hasWorkPermit")?.toString() || "";
    const currentGross = formData.get("currentGross")?.toString().trim() || "";
    const expectedGross =
      formData.get("expectedGross")?.toString().trim() || "";
    const noticePeriod =
      formData.get("noticePeriod")?.toString().trim() || "";

    const cvFile = formData.get("cv") as File | null;

    if (!fullName || !email || !cvFile) {
      console.error("job-applications: missing required fields", {
        fullName: !!fullName,
        email: !!email,
        cvFile: !!cvFile,
      });
      return redirectWithFlag(req.url, jobSlug || jobId, 0);
    }

    // ---- Upload CV to Supabase Storage ----
    let cvUrl: string | null = null;

    if (cvFile && cvFile.size > 0) {
      const arrayBuffer = await cvFile.arrayBuffer();
      const buffer = new Uint8Array(arrayBuffer);

      const safeName = cvFile.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
      const objectPath = `${tenantId}/jobs/${jobId}/${Date.now()}-${safeName}`;

      const { data: storageData, error: storageError } =
        await supabaseAdmin.storage
          .from(BUCKET_NAME)
          .upload(objectPath, buffer, {
            cacheControl: "3600",
            upsert: false,
            contentType: cvFile.type || "application/octet-stream",
          });

      if (storageError || !storageData) {
        console.error("job-applications: error uploading CV", storageError);
        return redirectWithFlag(req.url, jobSlug || jobId, 0);
      }

      const { data: publicData } = supabaseAdmin.storage
        .from(BUCKET_NAME)
        .getPublicUrl(storageData.path);

      cvUrl = publicData.publicUrl;
    }

    // ---- Build combined cover letter text (includes screening info) ----
    const combinedCoverLetter = [
      coverLetter,
      currentGross && `Current gross (self-reported): ${currentGross}`,
      expectedGross && `Expected gross (self-reported): ${expectedGross}`,
      noticePeriod && `Notice period: ${noticePeriod}`,
      hasWorkPermit && `Has valid work permit: ${hasWorkPermit}`,
    ]
      .filter(Boolean)
      .join("\n\n");

    // ---- Insert application into job_applications ----
    const { error: insertError } = await supabaseAdmin
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
        cv_url: cvUrl,
        cover_letter: combinedCoverLetter || null,
        source: "career_site",
        stage: "applied",
        status: "active",
      });

    if (insertError) {
      console.error("job-applications: error inserting job_application", insertError);
      return redirectWithFlag(req.url, jobSlug || jobId, 0);
    }

    // Success
    return redirectWithFlag(req.url, jobSlug || jobId, 1);
  } catch (err) {
    console.error("job-applications: unexpected error", err);
    return redirectWithFlag(req.url, null, 0);
  }
}

function redirectWithFlag(
  requestUrl: string,
  slugOrId: string | null,
  flag: 0 | 1
) {
  const url = new URL(requestUrl);

  if (slugOrId) {
    url.pathname = `/jobs/${slugOrId}`;
  } else {
    url.pathname = "/jobs";
  }

  url.search = `applied=${flag}`;
  return NextResponse.redirect(url.toString(), { status: 303 });
}
