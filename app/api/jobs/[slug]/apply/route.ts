// app/api/jobs/[slug]/apply/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type NormalisedBody = {
  jobSlug?: string;
  jobId?: string;
  fullName?: string;
  email?: string;
  phone?: string | null;
  location?: string | null;
  linkedinUrl?: string | null;
  portfolioUrl?: string | null;
  cvUrl?: string | null;
  coverLetter?: string | null;
  source?: string | null;
  headline?: string | null;
  notes?: string | null;
};

function trimOrUndefined(value: FormDataEntryValue | null): string | undefined {
  if (typeof value !== "string") return undefined;
  const t = value.trim();
  return t.length ? t : undefined;
}

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error("Supabase env vars are missing");
      return NextResponse.json(
        { error: "Server is not fully configured." },
        { status: 500 }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    const contentType = req.headers.get("content-type") || "";
    let body: NormalisedBody = {};

    // 1) Normalise input (JSON OR form-data) into one shape
    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();

      body = {
        jobSlug: trimOrUndefined(form.get("jobSlug") || form.get("job_slug")),
        jobId: trimOrUndefined(form.get("job_id")),
        fullName: trimOrUndefined(
          form.get("fullName") || form.get("full_name")
        ),
        email: trimOrUndefined(form.get("email")),
        phone: trimOrUndefined(form.get("phone")) ?? null,
        location: trimOrUndefined(form.get("location")) ?? null,
        linkedinUrl:
          trimOrUndefined(form.get("linkedinUrl") || form.get("linkedin_url")) ??
          null,
        portfolioUrl:
          trimOrUndefined(
            form.get("portfolioUrl") || form.get("portfolio_url")
          ) ?? null,
        cvUrl:
          trimOrUndefined(form.get("cvUrl") || form.get("cv_url")) ?? null,
        coverLetter:
          trimOrUndefined(
            form.get("coverLetter") || form.get("cover_letter")
          ) ?? null,
        source: trimOrUndefined(form.get("source")) ?? null,
      };
    } else {
      // assume JSON
      const json = (await req.json().catch(() => ({}))) as any;
      body = {
        jobSlug: json.jobSlug,
        jobId: json.jobId,
        fullName: json.fullName,
        email: json.email,
        phone: json.phone ?? null,
        location: json.location ?? null,
        linkedinUrl: json.linkedinUrl ?? null,
        portfolioUrl: json.portfolioUrl ?? null,
        cvUrl: json.cvUrl ?? null,
        coverLetter: json.coverLetter ?? null,
        source: json.source ?? null,
        headline: json.headline ?? null,
        notes: json.notes ?? null,
      };
    }

    const {
      jobSlug,
      jobId,
      fullName,
      email,
      phone,
      location,
      linkedinUrl,
      portfolioUrl,
      cvUrl,
      coverLetter,
      source,
      headline,
      notes,
    } = body;

    if (!fullName || !email) {
      return NextResponse.json(
        { error: "Full name and email are required." },
        { status: 400 }
      );
    }

    // Prefer coverLetter, then headline, then notes
    const finalCoverLetter =
      coverLetter || headline || notes || null;

    // 2) Resolve job_id: prefer explicit jobId; else look up via slug or id
    let jobRowId: string | null = null;

    if (jobId) {
      jobRowId = jobId;
    } else {
      const slugOrId = (jobSlug || params.slug || "").trim();
      if (!slugOrId) {
        return NextResponse.json(
          { error: "Missing job identifier." },
          { status: 400 }
        );
      }

      // Try by slug (open + public job)
      let { data: bySlug, error: slugError } = await supabase
        .from("jobs")
        .select("id")
        .eq("slug", slugOrId)
        .eq("status", "open")
        .eq("visibility", "public")
        .limit(1);

      if (slugError) {
        console.error("Error loading job by slug in apply route:", slugError);
      }

      if (bySlug && bySlug.length > 0) {
        jobRowId = bySlug[0].id as string;
      } else {
        // Fallback: treat slugOrId as a job id (UUID path)
        const { data: byId, error: idError } = await supabase
          .from("jobs")
          .select("id")
          .eq("id", slugOrId)
          .eq("status", "open")
          .eq("visibility", "public")
          .limit(1);

        if (idError) {
          console.error("Error loading job by id in apply route:", idError);
        }

        if (!byId || byId.length === 0) {
          return NextResponse.json(
            { error: "Job not found or not open/public." },
            { status: 404 }
          );
        }

        jobRowId = byId[0].id as string;
      }
    }

    if (!jobRowId) {
      return NextResponse.json(
        { error: "Unable to resolve job for this application." },
        { status: 400 }
      );
    }

    // 3) Insert into job_applications
    const insertPayload = {
      job_id: jobRowId,
      full_name: fullName,
      email,
      phone: phone || null,
      location: location || null,
      linkedin_url: linkedinUrl || null,
      portfolio_url: portfolioUrl || null,
      cv_url: cvUrl || null,
      cover_letter: finalCoverLetter,
      source: source || "Website",
      // stage, status use DB defaults: APPLIED / PENDING
    };

    const { data: inserted, error: insertError } = await supabase
      .from("job_applications")
      .insert(insertPayload)
      .select("id")
      .single();

    if (insertError || !inserted) {
      console.error("Error inserting job_application:", insertError);
      return NextResponse.json(
        {
          error:
            "Unexpected error while creating your application. Please try again.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { ok: true, applicationId: inserted.id },
      { status: 201 }
    );
  } catch (err) {
    console.error("Apply route unexpected error:", err);
    return NextResponse.json(
      {
        error:
          "Unexpected error while creating your application. Please try again.",
      },
      { status: 500 }
    );
  }
}
