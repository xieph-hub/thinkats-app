// app/api/jobs/[slug]/apply/route.ts
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServerClient";

type RouteParams = {
  params: {
    slug: string;
  };
};

type JobRow = {
  id: string;
  tenant_id: string;
  status: string;
  visibility: string;
};

export async function POST(req: Request, { params }: RouteParams) {
  try {
    const body: any = (await req.json().catch(() => ({}))) || {};

    // ── Identify the job ──────────────────────────────────────────────────────
    const slugOrId = (
      body.jobSlug ||
      body.job_slug ||
      body.slug ||
      params.slug ||
      ""
    )
      .toString()
      .trim();

    if (!slugOrId) {
      return NextResponse.json(
        { error: "Job slug is missing." },
        { status: 400 }
      );
    }

    // ── Core fields ───────────────────────────────────────────────────────────
    const rawFullName =
      body.fullName ?? body.full_name ?? body.name ?? null;
    const rawEmail =
      body.email ?? body.emailAddress ?? body.email_address ?? null;

    const fullName =
      typeof rawFullName === "string" && rawFullName.trim().length > 0
        ? rawFullName.trim()
        : null;
    const email =
      typeof rawEmail === "string" && rawEmail.trim().length > 0
        ? rawEmail.trim()
        : null;

    if (!fullName || !email) {
      return NextResponse.json(
        { error: "Full name and email are required." },
        { status: 400 }
      );
    }

    const phone =
      typeof body.phone === "string" && body.phone.trim().length > 0
        ? body.phone.trim()
        : null;
    const location =
      typeof body.location === "string" &&
      body.location.trim().length > 0
        ? body.location.trim()
        : null;
    const linkedinUrl =
      typeof body.linkedinUrl === "string" &&
      body.linkedinUrl.trim().length > 0
        ? body.linkedinUrl.trim()
        : null;
    const portfolioUrl =
      typeof body.portfolioUrl === "string" &&
      body.portfolioUrl.trim().length > 0
        ? body.portfolioUrl.trim()
        : null;

    // cvUrl is **only** coming from the client now
    const cvUrl =
      typeof body.cvUrl === "string" && body.cvUrl.trim().length > 0
        ? body.cvUrl.trim()
        : null;

    const headline =
      typeof body.headline === "string" &&
      body.headline.trim().length > 0
        ? body.headline.trim()
        : null;
    const notes =
      typeof body.notes === "string" && body.notes.trim().length > 0
        ? body.notes.trim()
        : null;

    // Compose cover_letter from headline + notes
    let coverLetter: string | null = null;
    if (headline || notes) {
      const parts: string[] = [];
      if (headline) {
        parts.push(`Headline / value areas:\n${headline}`);
      }
      if (notes) {
        parts.push(`Additional context:\n${notes}`);
      }
      coverLetter = parts.join("\n\n");
    }

    const supabase = await createSupabaseServerClient();

    // ── Find job by slug then id ──────────────────────────────────────────────
    const selectCols = `
      id,
      tenant_id,
      status,
      visibility
    `;

    let jobRow: JobRow | null = null;

    // Try by slug
    {
      const { data, error } = await supabase
        .from("jobs")
        .select(selectCols)
        .eq("slug", slugOrId)
        .limit(1);

      if (error) {
        console.error("Error loading job by slug in apply route", error);
      }

      if (data && data.length > 0) {
        const row: any = data[0];
        jobRow = {
          id: row.id,
          tenant_id: row.tenant_id,
          status: row.status,
          visibility: row.visibility,
        };
      }
    }

    // Fallback: by id
    if (!jobRow) {
      const { data, error } = await supabase
        .from("jobs")
        .select(selectCols)
        .eq("id", slugOrId)
        .limit(1);

      if (error) {
        console.error("Error loading job by id in apply route", error);
      }

      if (data && data.length > 0) {
        const row: any = data[0];
        jobRow = {
          id: row.id,
          tenant_id: row.tenant_id,
          status: row.status,
          visibility: row.visibility,
        };
      }
    }

    if (!jobRow) {
      return NextResponse.json(
        { error: "Job not found for this slug." },
        { status: 404 }
      );
    }

    // ── Insert into job_applications ──────────────────────────────────────────
    const { data: appInserted, error: appError } = await supabase
      .from("job_applications")
      .insert({
        job_id: jobRow.id,
        full_name: fullName,
        email,
        phone,
        location,
        linkedin_url: linkedinUrl,
        portfolio_url: portfolioUrl,
        cv_url: cvUrl, // 👉 directly using the JSON field
        cover_letter: coverLetter,
        source: "Website", // stage/status use defaults APPLIED/PENDING
      })
      .select("id")
      .single();

    if (appError || !appInserted) {
      console.error("Error inserting job_application", appError);
      return NextResponse.json(
        {
          error:
            "Could not create job application record. Please try again shortly.",
        },
        { status: 500 }
      );
    }

    const applicationId = (appInserted as { id: string }).id;

    return NextResponse.json(
      { ok: true, applicationId },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating application (outer catch)", error);
    return NextResponse.json(
      {
        error:
          "Unexpected error while creating your application. Please try again.",
      },
      { status: 500 }
    );
  }
}
