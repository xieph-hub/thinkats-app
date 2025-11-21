// app/api/jobs/[slug]/apply/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const slugOrId = params.slug;
    const contentType = req.headers.get("content-type") || "";

    let body: any = {};

    // JSON payload (from JobApplyForm)
    if (contentType.includes("application/json")) {
      body = await req.json();
    }
    // Fallback: HTML form posting multipart/form-data
    else if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const get = (name: string): string | undefined => {
        const v = form.get(name);
        if (typeof v !== "string") return undefined;
        const t = v.trim();
        return t.length ? t : undefined;
      };

      body = {
        jobSlug: get("jobSlug") ?? get("job_id") ?? slugOrId,
        fullName: get("fullName") ?? get("full_name"),
        email: get("email"),
        phone: get("phone"),
        location: get("location"),
        linkedinUrl: get("linkedinUrl") ?? get("linkedin_url"),
        portfolioUrl: get("portfolioUrl") ?? get("portfolio_url"),
        cvUrl: get("cvUrl"), // ⚠️ only from explicit cvUrl field
        coverLetter: get("coverLetter") ?? get("cover_letter"),
        source: get("source") ?? "careers_site",
      };
    } else {
      return NextResponse.json(
        { error: "Unsupported content type" },
        { status: 400 }
      );
    }

    const fullName = (body.fullName || "").trim();
    const email = (body.email || "").trim();

    if (!fullName || !email) {
      return NextResponse.json(
        { error: "Full name and email are required." },
        { status: 400 }
      );
    }

    const jobKey: string = (body.jobSlug || slugOrId).toString();

    // Fix uuid=text: cast id::text
    const jobRows = await prisma.$queryRaw<{ id: string }[]>`
      SELECT id
      FROM jobs
      WHERE slug = ${jobKey}
         OR id::text = ${jobKey}
      LIMIT 1;
    `;

    if (!jobRows || jobRows.length === 0) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    const jobId = jobRows[0].id;

    const phone =
      body.phone && String(body.phone).trim().length
        ? String(body.phone).trim()
        : null;

    const location =
      body.location && String(body.location).trim().length
        ? String(body.location).trim()
        : null;

    const linkedinUrl =
      body.linkedinUrl && String(body.linkedinUrl).trim().length
        ? String(body.linkedinUrl).trim()
        : null;

    const portfolioUrl =
      body.portfolioUrl && String(body.portfolioUrl).trim().length
        ? String(body.portfolioUrl).trim()
        : null;

    const cvUrl =
      body.cvUrl && String(body.cvUrl).trim().length
        ? String(body.cvUrl).trim()
        : null; // 👈 only explicit CV URL

    const coverLetterRaw =
      body.coverLetter || body.headline || body.notes || "";
    const coverLetter =
      coverLetterRaw && String(coverLetterRaw).trim().length
        ? String(coverLetterRaw).trim()
        : null;

    const source =
      body.source && String(body.source).trim().length
        ? String(body.source).trim()
        : "Website";

    const apps = await prisma.$queryRaw<{ id: string }[]>`
      INSERT INTO job_applications
        (job_id, full_name, email, phone, location,
         linkedin_url, portfolio_url, cv_url, cover_letter, source, stage, status)
      VALUES
        (${jobId}, ${fullName}, ${email}, ${phone}, ${location},
         ${linkedinUrl}, ${portfolioUrl}, ${cvUrl}, ${coverLetter}, ${source},
         'APPLIED', 'PENDING')
      RETURNING id;
    `;

    const applicationId = apps[0]?.id;
    return NextResponse.json({ ok: true, applicationId });
  } catch (error) {
    console.error("Error creating application", error);
    return NextResponse.json(
      {
        error:
          "Unexpected error while creating your application. Please try again.",
      },
      { status: 500 }
    );
  }
}
