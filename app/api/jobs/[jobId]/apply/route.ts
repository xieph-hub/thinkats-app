// app/api/jobs/[jobId]/apply/route.ts

import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(
  req: Request,
  { params }: { params: { jobId: string } }
) {
  try {
    const jobId = params.jobId;

    if (!jobId) {
      return NextResponse.json(
        { error: "Missing job id." },
        { status: 400 }
      );
    }

    // Parse JSON body safely
    const body = await req.json().catch(() => null);

    if (!body) {
      return NextResponse.json(
        { error: "Invalid JSON body." },
        { status: 400 }
      );
    }

    const {
      fullName,
      email,
      phone = null,
      location = null,
      linkedinUrl = null,
      portfolioUrl = null,
      cvUrl = null,
      coverLetter = null,
      source = "Job apply form",
    } = body;

    if (!fullName || !email) {
      return NextResponse.json(
        { error: "Full name and email are required." },
        { status: 400 }
      );
    }

    // Make sure the job exists and is published
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: { id: true, isPublished: true },
    });

    if (!job || job.isPublished === false) {
      return NextResponse.json(
        { error: "Job not found or not accepting applications." },
        { status: 404 }
      );
    }

    // Create the application (we rely on default enum values)
    await prisma.jobApplication.create({
      data: {
        jobId: job.id,
        fullName,
        email,
        phone,
        location,
        linkedinUrl,
        portfolioUrl,
        cvUrl,
        coverLetter,
        source,
        // stage/status default from Prisma schema:
        // stage: APPLIED, status: PENDING
      },
    });

    return NextResponse.json(
      {
        ok: true,
        message: "Application submitted successfully.",
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Error creating job application:", err);
    return NextResponse.json(
      {
        error: "Unexpected server error while submitting application.",
      },
      { status: 500 }
    );
  }
}
