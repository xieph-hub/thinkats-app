// app/api/apply/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

type ApplyBody = {
  jobSlug: string;
  jobTitle: string;
  name: string;
  email: string;
  phone?: string;
  location?: string;
  resumeUrl?: string;
  source?: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ApplyBody;

    const { jobSlug, jobTitle, name, email, phone, location, resumeUrl, source } = body;

    if (!jobSlug || !jobTitle || !name || !email) {
      return NextResponse.json(
        {
          ok: false,
          message: "Missing required fields (jobSlug, jobTitle, name, email).",
        },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 1) Ensure Job exists (create a placeholder if needed)
    let job = await prisma.job.findUnique({
      where: { slug: jobSlug },
    });

    if (!job) {
      job = await prisma.job.create({
        data: {
          slug: jobSlug,
          title: jobTitle,
          description:
            "This job posting was created automatically when a candidate applied. Please update the full description from the admin panel.",
          excerpt: null,
          department: null,
          location: location || null,
          type: null,
          isPublished: false,
        },
      });
    }

    // 2) Find or create Candidate
    let candidate = await prisma.candidate.findFirst({
      where: { email: normalizedEmail },
    });

    if (!candidate) {
      candidate = await prisma.candidate.create({
        data: {
          // 👇 connect this candidate to the job they applied for
          job: {
            connect: {
              id: job.id, // assumes you already fetched `job` earlier in this file
            },
          },
          fullname: name,
          email: normalizedEmail,
          phone: phone || null,
          location: location || null,
          resumeUrl: resumeUrl || null,
        },
      });
          } else {
      // Update existing candidate with any new info from this application
      candidate = await prisma.candidate.update({
        where: { id: candidate.id },
        data: {
          fullname: candidate.fullname ?? name,
          phone: phone || candidate.phone,
          location: location || candidate.location,
          resumeUrl: resumeUrl || candidate.resumeUrl,
        },
      });
    }

    // 3) Create Application
    const application = await prisma.application.create({
      data: {
        jobId: job.id,
        candidateId: candidate.id,
        stage: "APPLIED",
        source: source || "inbound",
      },
    });

    return NextResponse.json(
      {
        ok: true,
        message: "Application submitted successfully.",
        applicationId: application.id,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Apply API error:", err);
    return NextResponse.json(
      {
        ok: false,
        message: "Something went wrong while submitting your application.",
      },
      { status: 500 }
    );
  }
}
