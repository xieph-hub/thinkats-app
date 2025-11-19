// app/api/jobs/[slug]/apply/route.ts

import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const slugOrId = params.slug;

    // 1) Find the job by slug OR id (no extra filters for now)
    const job = await prisma.job.findFirst({
      where: {
        OR: [{ slug: slugOrId }, { id: slugOrId }],
      },
    });

    if (!job) {
      return NextResponse.json(
        { error: "Job not found or not accepting applications." },
        { status: 404 }
      );
    }

    // 2) Parse JSON body
    const body = await req.json();

    const fullName = (body.fullName ?? "").toString().trim();
    const email = (body.email ?? "").toString().trim();

    if (!fullName || !email) {
      return NextResponse.json(
        { error: "Full name and email are required." },
        { status: 400 }
      );
    }

    // 3) Create JobApplication (stage/status use Prisma defaults)
    const application = await prisma.jobApplication.create({
      data: {
        jobId: job.id,
        fullName,
        email,
        phone: body.phone?.toString().trim() || null,
        location: body.location?.toString().trim() || null,
        linkedinUrl: body.linkedinUrl?.toString().trim() || null,
        portfolioUrl: body.portfolioUrl?.toString().trim() || null,
        cvUrl: body.cvUrl?.toString().trim() || null,
        coverLetter: body.coverLetter?.toString().trim() || null,
        source: body.source?.toString().trim() || "Job detail form",
        // stage/status left out – Prisma + DB defaults handle them
      },
    });

    return NextResponse.json({ ok: true, id: application.id });
  } catch (error) {
    console.error("Job application error:", error);
    return NextResponse.json(
      { error: "Unexpected error while submitting application." },
      { status: 500 }
    );
  }
}
