// app/api/jobs/[slug]/apply/route.ts

import { NextResponse } from "next/server";
import {
  PrismaClient,
  ApplicationStage,
  ApplicationStatus,
} from "@prisma/client";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const prisma = new PrismaClient();

export async function POST(
  req: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const formData = await req.formData();

    const fullName = String(formData.get("fullName") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const phone = String(formData.get("phone") || "").trim();
    const location = String(formData.get("location") || "").trim();
    const linkedinUrl = String(formData.get("linkedinUrl") || "").trim();
    const portfolioUrl = String(formData.get("portfolioUrl") || "").trim();
    const headline = String(formData.get("headline") || "").trim();
    const notes = String(formData.get("notes") || "").trim();
    let cvUrlRaw = String(formData.get("cvUrl") || "").trim() || null;

    const cvFile = formData.get("cvFile") as File | null;

    if (!fullName || !email) {
      return NextResponse.json(
        { error: "Full name and email are required." },
        { status: 400 }
      );
    }

    // Find job by slug or id
    const job = await prisma.job.findFirst({
      where: {
        OR: [{ slug: params.slug }, { id: params.slug }],
      },
    });

    if (!job) {
      return NextResponse.json(
        { error: "Job not found or not accepting applications." },
        { status: 404 }
      );
    }

    // If a file is uploaded, store it as a data URL in cvUrl (works without extra infra)
    if (cvFile && cvFile.size > 0) {
      const arrayBuffer = await cvFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64 = buffer.toString("base64");
      const mimeType = cvFile.type || "application/octet-stream";
      cvUrlRaw = `data:${mimeType};base64,${base64}`;
    }

    // Find or create candidate by email + tenant
    let candidate = await prisma.candidate.findFirst({
      where: {
        email,
        tenantId: job.tenantId,
      },
    });

    if (!candidate) {
      candidate = await prisma.candidate.create({
        data: {
          tenantId: job.tenantId,
          fullName,
          email,
          phone: phone || null,
          location: location || null,
          linkedinUrl: linkedinUrl || null,
          primaryFunction: job.function || null,
          seniority: job.seniority || null,
          cvUrl: cvUrlRaw,
          notes: headline || notes || null,
        },
      });
    } else {
      candidate = await prisma.candidate.update({
        where: { id: candidate.id },
        data: {
          fullName,
          phone: phone || candidate.phone,
          location: location || candidate.location,
          linkedinUrl: linkedinUrl || candidate.linkedinUrl,
          cvUrl: cvUrlRaw || candidate.cvUrl,
          notes: headline || notes || candidate.notes,
        },
      });
    }

    await prisma.jobApplication.create({
      data: {
        jobId: job.id,
        candidateId: candidate.id,
        fullName,
        email,
        phone: phone || null,
        location: location || null,
        linkedinUrl: linkedinUrl || null,
        portfolioUrl: portfolioUrl || null,
        cvUrl: cvUrlRaw,
        coverLetter: headline || null,
        source: "Website",
        stage: ApplicationStage.APPLIED,
        status: ApplicationStatus.PENDING,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Application submit error", err);
    return NextResponse.json(
      { error: "Unexpected error while submitting application." },
      { status: 500 }
    );
  }
}
