// app/api/jobs/[slug]/apply/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApplicationStage, ApplicationStatus } from "@prisma/client";
import { uploadCvFile } from "@/lib/uploadCv";

async function findJobBySlugOrId(slugOrId: string) {
  // Prefer slug
  let job = await prisma.job.findFirst({
    where: { slug: slugOrId, isPublished: true },
  });

  if (!job) {
    job = await prisma.job.findFirst({
      where: { id: slugOrId, isPublished: true },
    });
  }

  return job;
}

export async function POST(
  req: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const formData = await req.formData();
    const slugOrId = params.slug;

    const job = await findJobBySlugOrId(slugOrId);

    if (!job) {
      return NextResponse.json(
        { error: "Job not found or not accepting applications." },
        { status: 404 }
      );
    }

    const fullName = String(formData.get("fullName") || "").trim();
    const email = String(formData.get("email") || "").trim().toLowerCase();
    const phone = String(formData.get("phone") || "").trim() || null;
    const location = String(formData.get("location") || "").trim() || null;
    const linkedinUrl =
      String(formData.get("linkedinUrl") || "").trim() || null;
    const portfolioUrl =
      String(formData.get("portfolioUrl") || "").trim() || null;
    const source = String(formData.get("source") || "").trim() || "Website";
    const coverLetter =
      String(formData.get("coverLetter") || "").trim() || null;

    if (!fullName || !email) {
      return NextResponse.json(
        { error: "Full name and email are required." },
        { status: 400 }
      );
    }

    const cvUrlField = String(formData.get("cvUrl") || "").trim();
    const cvFile = formData.get("cvFile");

    let finalCvUrl: string | null = cvUrlField || null;

    // Upload file if provided
    if (cvFile instanceof File && cvFile.size > 0) {
      const uploadedUrl = await uploadCvFile(cvFile, job.id);
      if (uploadedUrl) {
        finalCvUrl = uploadedUrl;
      }
    }

    // Candidate upsert by email (global unique in your schema)
    const existingCandidate = await prisma.candidate.findUnique({
      where: { email },
    });

    let candidate;
    if (existingCandidate) {
      candidate = await prisma.candidate.update({
        where: { email },
        data: {
          fullName,
          phone: phone ?? existingCandidate.phone,
          location: location ?? existingCandidate.location,
          linkedinUrl: linkedinUrl ?? existingCandidate.linkedinUrl,
          portfolioUrl: portfolioUrl ?? existingCandidate.portfolioUrl,
          cvUrl: finalCvUrl ?? existingCandidate.cvUrl,
          primaryFunction: existingCandidate.primaryFunction,
          seniority: existingCandidate.seniority,
        },
      });
    } else {
      candidate = await prisma.candidate.create({
        data: {
          tenantId: job.tenantId,
          fullName,
          email,
          phone,
          location,
          linkedinUrl,
          portfolioUrl,
          cvUrl: finalCvUrl,
        },
      });
    }

    const application = await prisma.jobApplication.create({
      data: {
        jobId: job.id,
        candidateId: candidate.id,
        fullName,
        email,
        phone,
        location,
        linkedinUrl,
        portfolioUrl,
        cvUrl: finalCvUrl,
        coverLetter,
        source,
        stage: ApplicationStage.APPLIED,
        status: ApplicationStatus.PENDING,
      },
    });

    return NextResponse.json({
      ok: true,
      applicationId: application.id,
    });
  } catch (err) {
    console.error("Job application error:", err);
    return NextResponse.json(
      {
        error:
          "Something went wrong while submitting your application. Please try again.",
      },
      { status: 500 }
    );
  }
}
