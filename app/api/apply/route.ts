import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDefaultTenant } from "@/lib/tenant";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const jobId = formData.get("jobId");
    const fullName = formData.get("fullName");
    const email = formData.get("email");
    const phone = formData.get("phone");
    const location = formData.get("location");
    const linkedinUrl = formData.get("linkedinUrl");
    const portfolioUrl = formData.get("portfolioUrl");
    const coverLetter = formData.get("coverLetter");
    const source = formData.get("source") ?? "Website";
    const rawFile = formData.get("cv");

    if (!jobId || typeof jobId !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid jobId." },
        { status: 400 }
      );
    }

    if (!fullName || typeof fullName !== "string") {
      return NextResponse.json(
        { error: "Full name is required." },
        { status: 400 }
      );
    }

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    const tenant = await getDefaultTenant();

    // Make sure the job exists for this tenant
    const job = await prisma.job.findFirst({
      where: {
        id: jobId,
        tenantId: tenant.id,
        isPublished: true,
      },
    });

    if (!job) {
      return NextResponse.json(
        { error: "This role is no longer available." },
        { status: 400 }
      );
    }

    // Basic note about the CV (real file upload will come later)
    let fileNote: string | null = null;
    if (rawFile && typeof rawFile === "object" && "name" in rawFile) {
      const anyFile = rawFile as any;
      fileNote = `CV uploaded via website: ${anyFile.name ?? "unnamed file"}`;
    } else {
      fileNote = null;
    }

    // -----------------------------
    // Candidate: find or create
    // -----------------------------
    const existingCandidate = await prisma.candidate.findFirst({
      where: {
        tenantId: tenant.id,
        email: normalizedEmail,
      },
    });

    let candidate;

    if (existingCandidate) {
      candidate = await prisma.candidate.update({
        where: { id: existingCandidate.id },
        data: {
          fullName: fullName.trim(),
          phone: typeof phone === "string" ? phone : undefined,
          location: typeof location === "string" ? location : undefined,
          linkedinUrl: typeof linkedinUrl === "string" ? linkedinUrl : undefined,
          ...(fileNote ? { notes: fileNote } : {}),
        },
      });
    } else {
      candidate = await prisma.candidate.create({
        data: {
          tenantId: tenant.id,
          fullName: fullName.trim(),
          email: normalizedEmail,
          phone: typeof phone === "string" ? phone : null,
          location: typeof location === "string" ? location : null,
          linkedinUrl: typeof linkedinUrl === "string" ? linkedinUrl : null,
          notes: fileNote,
        },
      });
    }

    // -----------------------------
    // Job application row
    // -----------------------------
    // For now we set a placeholder cvUrl. Later we'll upload to Supabase Storage.
    const cvUrl = "pending-storage-upload";

    const application = await prisma.jobApplication.create({
      data: {
        jobId: job.id,
        candidateId: candidate.id,
        fullName: fullName.trim(),
        email: normalizedEmail,
        phone: typeof phone === "string" ? phone : null,
        location: typeof location === "string" ? location : null,
        linkedinUrl: typeof linkedinUrl === "string" ? linkedinUrl : null,
        portfolioUrl: typeof portfolioUrl === "string" ? portfolioUrl : null,
        cvUrl,
        coverLetter:
          typeof coverLetter === "string" && coverLetter.trim().length > 0
            ? coverLetter
            : null,
        source: typeof source === "string" ? source : "Website",
      },
    });

    return NextResponse.json(
      {
        ok: true,
        applicationId: application.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in /api/apply", error);
    return NextResponse.json(
      {
        error:
          "Something went wrong while submitting your application. Please try again.",
      },
      { status: 500 }
    );
  }
}
