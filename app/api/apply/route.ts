import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

    // --- Basic validation ---
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

    // --- Get the job directly by id ---
    const job = await prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      return NextResponse.json(
        { error: "This role is no longer available." },
        { status: 400 }
      );
    }

    const tenantId = job.tenantId; // use the tenant from the job

    // --- Light handling of CV file (no real upload yet) ---
    let fileNote: string | null = null;
    if (rawFile && typeof rawFile === "object" && "name" in rawFile) {
      const anyFile = rawFile as any;
      fileNote = `CV uploaded via website: ${anyFile.name ?? "unnamed file"}`;
    }

    // -----------------------------
    // Candidate: find or create
    // -----------------------------
    const existingCandidate = await prisma.candidate.findFirst({
      where: {
        tenantId,
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
          // don't overwrite any existing notes unless we have a file note
          ...(fileNote ? { notes: fileNote } : {}),
        },
      });
    } else {
      candidate = await prisma.candidate.create({
        data: {
          tenantId,
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
    // Placeholder cvUrl for now, until we hook Supabase Storage
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
  } catch (error: any) {
    console.error("Error in /api/apply:", error);

    // Send a more useful error message back (for now)
    return NextResponse.json(
      {
        error:
          error?.message ||
          "Something went wrong while submitting your application.",
      },
      { status: 500 }
    );
  }
}
