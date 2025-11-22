// app/api/jobs/[slug]/apply/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteParams = { params: { slug: string } };

export async function POST(req: NextRequest, { params }: RouteParams) {
  const slugOrId = params.slug;

  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { ok: false, error: "Invalid JSON body." },
        { status: 400 }
      );
    }

    const {
      fullName,
      email,
      phone,
      location,
      linkedinUrl,
      portfolioUrl,
      cvUrl,
      coverLetter,
      source,
    } = body ?? {};

    if (
      !fullName ||
      typeof fullName !== "string" ||
      !email ||
      typeof email !== "string"
    ) {
      return NextResponse.json(
        { ok: false, error: "Full name and email are required." },
        { status: 400 }
      );
    }

    // 1) Find an open, public job by slug OR id
    const job = await prisma.job.findFirst({
      where: {
        AND: [
          { status: "open" as any },
          { visibility: "public" as any },
          {
            OR: [{ slug: slugOrId }, { id: slugOrId }],
          },
        ],
      },
      select: { id: true },
    });

    if (!job) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Job not found, closed, or not visible publicly. Please check the job link.",
        },
        { status: 404 }
      );
    }

    // 2) Upsert candidate by email (if your Candidate model uses a different unique field,
    // adjust the `where` and `create`/`update` structures accordingly)
    let candidateId: string | null = null;
    try {
      const candidate = await prisma.candidate.upsert({
        where: { email },
        update: {
          fullName,
          phone: phone || undefined,
          location: location || undefined,
          linkedinUrl: linkedinUrl || undefined,
          portfolioUrl: portfolioUrl || undefined,
        },
        create: {
          fullName,
          email,
          phone: phone || undefined,
          location: location || undefined,
          linkedinUrl: linkedinUrl || undefined,
          portfolioUrl: portfolioUrl || undefined,
          source: source || "Website",
        },
        select: { id: true },
      });

      candidateId = candidate.id;
    } catch (err) {
      console.error("Error creating/updating candidate", err);
      // If candidate fails for some reason, we still allow application with null candidateId
    }

    // 3) Create application
    const application = await prisma.jobApplication.create({
      data: {
        jobId: job.id,
        candidateId,
        fullName,
        email,
        phone: phone || null,
        location: location || null,
        linkedinUrl: linkedinUrl || null,
        portfolioUrl: portfolioUrl || null,
        cvUrl: cvUrl || null, // <- this is what /ats will show as CV link
        coverLetter: coverLetter || null,
        source: source || "Website",
        stage: "APPLIED" as any,
        status: "PENDING" as any,
      },
      select: { id: true },
    });

    return NextResponse.json(
      { ok: true, applicationId: application.id },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("Error creating application", err);
    return NextResponse.json(
      {
        ok: false,
        error: "Unexpected error while creating your application.",
        // helpful when testing locally; hidden in prod UI
        details:
          process.env.NODE_ENV === "development"
            ? String(err?.message ?? err)
            : undefined,
      },
      { status: 500 }
    );
  }
}
