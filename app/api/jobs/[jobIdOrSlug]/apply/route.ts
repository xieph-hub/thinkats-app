// app/api/jobs/[jobIdOrSlug]/apply/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

type JobRow = {
  id: string;
  slug: string | null;
  tenant_id: string | null;
};

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value
  );
}

export async function POST(
  req: NextRequest,
  { params }: { params: { jobIdOrSlug: string } }
) {
  try {
    const identifier = params.jobIdOrSlug;

    // We expect multipart/form-data from the public form
    const formData = await req.formData();

    // optional override of jobId, but we will always trust DB lookup
    const jobIdOverride = formData.get("jobId") as string | null;

    // 1) Resolve job by slug first, then by id if identifier is a UUID
    let job: JobRow | null = null;

    const { data: slugData, error: slugError } = await supabaseAdmin
      .from("jobs")
      .select("id, slug, tenant_id")
      .eq("slug", identifier)
      .eq("visibility", "public")
      .limit(1);

    if (!slugError && slugData && slugData.length > 0) {
      job = slugData[0] as JobRow;
    }

    if (!job && isUuid(identifier)) {
      const { data: idData, error: idError } = await supabaseAdmin
        .from("jobs")
        .select("id, slug, tenant_id")
        .eq("id", identifier)
        .eq("visibility", "public")
        .limit(1);

      if (!idError && idData && idData.length > 0) {
        job = idData[0] as JobRow;
      }
    }

    if (!job) {
      return NextResponse.json(
        { error: "This job is no longer accepting applications." },
        { status: 404 }
      );
    }

    const jobId = job.id;
    const tenantId = job.tenant_id ?? null; // if you decide to store tenant_id later

    // 2) Extract fields from form
    const full_name = (formData.get("full_name") as string | null)?.trim();
    const email = (formData.get("email") as string | null)?.trim();
    const phone = (formData.get("phone") as string | null)?.trim() || null;
    const location =
      (formData.get("location") as string | null)?.trim() || null;
    const linkedin_url =
      (formData.get("linkedin_url") as string | null)?.trim() || null;
    const cover_letter =
      (formData.get("cover_letter") as string | null)?.trim() || null;

    if (!full_name || !email) {
      return NextResponse.json(
        {
          error:
            "Full name and email are required. Please fill these in and try again.",
        },
        { status: 400 }
      );
    }

    // 3) Handle CV upload (optional but recommended)
    const cvFile = formData.get("cv") as File | null;
    let cv_url: string | null = null;

    if (cvFile && cvFile.size > 0) {
      const arrayBuffer = await cvFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const ext =
        cvFile.name.split(".").pop()?.toLowerCase() === "pdf"
          ? "pdf"
          : cvFile.name.split(".").pop() || "bin";

      const objectPath = `cvs/${jobId}/${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}.${ext}`;

      const { error: uploadError } = await supabaseAdmin.storage
        .from("resourcin-uploads")
        .upload(objectPath, buffer, {
          contentType: cvFile.type || "application/octet-stream",
          upsert: false,
        });

      if (uploadError) {
        console.error("CV upload error:", uploadError);
        // We don't hard-fail the whole request; candidate can still be created
      } else {
        const { data: publicUrlData } = supabaseAdmin.storage
          .from("resourcin-uploads")
          .getPublicUrl(objectPath);

        cv_url = publicUrlData?.publicUrl ?? null;
      }
    }

    // 4) Insert into job_applications
    const insertPayload: Record<string, unknown> = {
      job_id: jobId,
      full_name,
      email,
      phone,
      location,
      linkedin_url,
      portfolio_url: null,
      cv_url,
      cover_letter,
      source: "public_jobs_page",
      // Let defaults handle stage/status, but you can override if you want:
      // stage: "APPLIED",
      // status: "PENDING",
      screening_answers: null,
      how_heard: null,
      data_privacy_consent: null,
      terms_consent: null,
      marketing_opt_in: null,
      reference_code: null,
    };

    const { data: inserted, error: insertError } = await supabaseAdmin
      .from("job_applications")
      .insert(insertPayload)
      .select("id")
      .single();

    if (insertError || !inserted) {
      console.error("Error inserting job application:", insertError);
      return NextResponse.json(
        {
          error:
            "We couldn't submit your application. Please try again or email your CV directly.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        message: "Thank you. Your application has been received.",
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Unexpected error in public job apply route:", err);
    return NextResponse.json(
      {
        error:
          "We couldn't submit your application. Please try again or email your CV directly.",
      },
      { status: 500 }
    );
  }
}
