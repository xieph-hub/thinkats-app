// app/api/jobs/[slug]/apply/route.ts

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const FALLBACK_SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.resourcin.com";

async function findJob(slugOrId: string) {
  const { data, error } = await supabaseAdmin
    .from("jobs")
    .select(
      `
        id,
        tenant_id,
        slug,
        title,
        status,
        visibility
      `
    )
    .or(`slug.eq.${slugOrId},id.eq.${slugOrId}`)
    .limit(1);

  if (error || !data || data.length === 0) {
    console.error("Error finding job for application", error);
    return null;
  }

  const row: any = data[0];

  // Only allow applications to open + public roles
  if (row.status !== "open" || row.visibility !== "public") {
    return null;
  }

  return {
    id: row.id as string,
    tenantId: row.tenant_id as string | null,
    slug: (row.slug ?? null) as string | null,
    title: row.title as string,
  };
}

export async function POST(
  req: NextRequest,
  context: { params: { slug: string } }
) {
  const slugOrId = context.params.slug;

  const job = await findJob(slugOrId);
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const formData = await req.formData();

  const jobIdFromForm = (formData.get("job_id") ?? "").toString();
  const fullName = (formData.get("full_name") ?? "").toString().trim();
  const email = (formData.get("email") ?? "").toString().trim().toLowerCase();
  const phone = (formData.get("phone") ?? "").toString().trim() || null;
  const location = (formData.get("location") ?? "").toString().trim() || null;
  const linkedinUrl =
    (formData.get("linkedin_url") ?? "").toString().trim() || null;
  const portfolioUrl =
    (formData.get("portfolio_url") ?? "").toString().trim() || null;
  const coverLetter =
    (formData.get("cover_letter") ?? "").toString().trim() || null;
  const source =
    (formData.get("source") ?? "").toString().trim() || "careers_site";

  const cvFile = formData.get("cv") as File | null;

  // sanity check: the form job id must match the job we resolved from slug
  if (!jobIdFromForm || jobIdFromForm !== job.id) {
    console.warn("Job ID mismatch on application", {
      jobFromSlug: job.id,
      jobFromForm: jobIdFromForm,
    });

    const redirectUrl = new URL(
      `/jobs/${job.slug || job.id}/apply`,
      FALLBACK_SITE_URL
    );
    return NextResponse.redirect(redirectUrl, { status: 303 });
  }

  if (!fullName || !email) {
    const redirectUrl = new URL(
      `/jobs/${job.slug || job.id}/apply`,
      FALLBACK_SITE_URL
    );
    return NextResponse.redirect(redirectUrl, { status: 303 });
  }

  // ---------- Optional: upload CV to Supabase Storage ----------
  let cvPublicUrl: string | null = null;

  try {
    if (cvFile && typeof cvFile.arrayBuffer === "function") {
      const arrayBuffer = await cvFile.arrayBuffer();
      const fileExt = cvFile.name.split(".").pop() || "pdf";

      // You can rename "cvs" to whatever bucket you set up in Supabase.
      const filePath = `cvs/${job.id}/${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}.${fileExt}`;

      const { error: uploadError } = await supabaseAdmin.storage
        .from("cvs")
        .upload(filePath, arrayBuffer, {
          contentType: cvFile.type || "application/octet-stream",
          upsert: false,
        });

      if (!uploadError) {
        const { data: publicData } = supabaseAdmin.storage
          .from("cvs")
          .getPublicUrl(filePath);

        if (publicData?.publicUrl) {
          cvPublicUrl = publicData.publicUrl;
        }
      } else {
        console.error("Error uploading CV", uploadError);
      }
    }
  } catch (err) {
    console.error("Unexpected error while uploading CV", err);
  }

  // ---------- Insert into job_applications ----------
  try {
    const { error: insertError } = await supabaseAdmin
      .from("job_applications")
      .insert({
        job_id: job.id,
        candidate_id: null, // can later link to candidates table
        full_name: fullName,
        email,
        phone,
        location,
        linkedin_url: linkedinUrl,
        portfolio_url: portfolioUrl,
        cv_url: cvPublicUrl,
        cover_letter: coverLetter,
        source,
        // stage + status will use defaults: 'APPLIED', 'PENDING'
      });

    if (insertError) {
      console.error("Error inserting job application", insertError);
      const redirectUrl = new URL(
        `/jobs/${job.slug || job.id}/apply`,
        FALLBACK_SITE_URL
      );
      return NextResponse.redirect(redirectUrl, { status: 303 });
    }
  } catch (err) {
    console.error("Unexpected error inserting job application", err);
    const redirectUrl = new URL(
      `/jobs/${job.slug || job.id}/apply`,
      FALLBACK_SITE_URL
    );
    return NextResponse.redirect(redirectUrl, { status: 303 });
  }

  // On success, send the candidate back to the job page with a success flag
  const successRedirectUrl = new URL(
    `/jobs/${job.slug || job.id}?applied=1`,
    FALLBACK_SITE_URL
  );

  return NextResponse.redirect(successRedirectUrl, { status: 303 });
}
