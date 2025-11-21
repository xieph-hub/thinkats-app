// app/api/jobs/[slug]/apply/route.ts
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServerClient";

export const runtime = "nodejs";

type PageParams = {
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

export async function POST(req: Request, { params }: PageParams) {
  try {
    const contentType = req.headers.get("content-type") || "";

    let jobSlugFromBody: string | null = null;
    let fullName: string | null = null;
    let email: string | null = null;
    let phone: string | null = null;
    let location: string | null = null;
    let linkedinUrl: string | null = null;
    let portfolioUrl: string | null = null;
    let headline: string | null = null;
    let notes: string | null = null;
    let cvUrlFromLink: string | null = null;

    // ─── Branch 1: JSON body (if someone posts JSON) ────────────────────────────
    if (contentType.includes("application/json")) {
      const body: any = (await req.json().catch(() => ({}))) || {};

      jobSlugFromBody =
        (body.jobSlug || body.job_slug || body.slug || "").toString().trim() ||
        null;

      const rawFullName =
        body.fullName || body.full_name || body.name || null;
      const rawEmail =
        body.email || body.emailAddress || body.email_address || null;

      fullName =
        typeof rawFullName === "string" && rawFullName.trim().length > 0
          ? rawFullName.trim()
          : null;
      email =
        typeof rawEmail === "string" && rawEmail.trim().length > 0
          ? rawEmail.trim()
          : null;

      phone =
        typeof body.phone === "string" && body.phone.trim().length > 0
          ? body.phone.trim()
          : null;
      location =
        typeof body.location === "string" && body.location.trim().length > 0
          ? body.location.trim()
          : null;
      linkedinUrl =
        typeof body.linkedinUrl === "string" &&
        body.linkedinUrl.trim().length > 0
          ? body.linkedinUrl.trim()
          : null;
      portfolioUrl =
        typeof body.portfolioUrl === "string" &&
        body.portfolioUrl.trim().length > 0
          ? body.portfolioUrl.trim()
          : null;
      headline =
        typeof body.headline === "string" && body.headline.trim().length > 0
          ? body.headline.trim()
          : null;
      notes =
        typeof body.notes === "string" && body.notes.trim().length > 0
          ? body.notes.trim()
          : null;

      if (typeof body.cvUrl === "string" && body.cvUrl.trim().length > 0) {
        cvUrlFromLink = body.cvUrl.trim();
      }
    } else {
      // ─── Branch 2: FormData (your JobApplyForm) ───────────────────────────────
      const formData = await req.formData();

      const getText = (key: string): string | null => {
        const v = formData.get(key);
        if (typeof v !== "string") return null;
        const trimmed = v.trim();
        return trimmed.length > 0 ? trimmed : null;
      };

      jobSlugFromBody = getText("jobSlug");

      fullName = getText("fullName") || getText("full_name");
      email = getText("email");

      phone = getText("phone");
      location = getText("location");
      linkedinUrl = getText("linkedinUrl");
      portfolioUrl = getText("portfolioUrl");
      headline = getText("headline");
      notes = getText("notes");

      const cvUrlText = getText("cvUrl");
      cvUrlFromLink = cvUrlText && cvUrlText.length > 0 ? cvUrlText : null;

      // NOTE: we are ignoring the actual file (cvFile) for now to avoid
      // upload-related crashes. We'll wire this in once everything is stable.
      // const maybeCvFile = formData.get("cvFile");
    }

    // ─── Validate basics ────────────────────────────────────────────────────────
    if (!fullName || !email) {
      console.warn("Apply route: missing fullName or email", {
        fullName,
        email,
        contentType,
      });
      return NextResponse.json(
        { error: "Full name and email are required." },
        { status: 400 }
      );
    }

    const slugOrId = (jobSlugFromBody || params.slug || "").trim();
    if (!slugOrId) {
      return NextResponse.json(
        { error: "Job slug is missing." },
        { status: 400 }
      );
    }

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

    const cvUrl = cvUrlFromLink || null;

    const supabase = await createSupabaseServerClient();

    // ─── 1) Find job by slug or id ─────────────────────────────────────────────
    const selectCols = `
      id,
      tenant_id,
      status,
      visibility
    `;

    let jobRow: JobRow | null = null;

    // Try match by slug
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

    // If not found by slug, try by id (UUID path)
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

    const jobId = jobRow.id;
    // const tenantId = jobRow.tenant_id; // not used yet, but kept for later

    // ─── 2) Insert job_application (NO candidate table for now) ────────────────
    const { data: appInserted, error: appError } = await supabase
      .from("job_applications")
      .insert({
        job_id: jobId,
        // candidate_id: null, // we are not touching candidates table now
        full_name: fullName,
        email,
        phone,
        location,
        linkedin_url: linkedinUrl,
        portfolio_url: portfolioUrl,
        cv_url: cvUrl,
        cover_letter: coverLetter,
        source: "Website",
        // stage and status use defaults: APPLIED / PENDING
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
