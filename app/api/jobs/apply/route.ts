// app/api/jobs/apply/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getResourcinTenant } from "@/lib/tenant";

/**
 * Public job application endpoint (non-dynamic).
 * Expects a jobId field in JSON body or multipart/form-data.
 */
export async function POST(req: Request) {
  try {
    const tenant = await getResourcinTenant();
    const contentType = req.headers.get("content-type") || "";

    let jobId: string | null = null;

    // Common fields
    let fullName = "";
    let email = "";
    let phone: string | null = null;
    let location: string | null = null;
    let linkedinUrl: string | null = null;
    let portfolioUrl: string | null = null;
    let githubUrl: string | null = null;
    let coverLetter: string | null = null;
    let cvUrl: string | null = null;
    let source: string | null = null;
    let howHeard: string | null = null;
    let noticePeriod: string | null = null;
    let currentGrossAnnual: string | null = null;
    let grossAnnualExpectation: string | null = null;

    if (contentType.includes("application/json")) {
      const body = await req.json();

      jobId =
        typeof body.jobId === "string" && body.jobId.trim().length > 0
          ? body.jobId.trim()
          : null;

      fullName = (body.fullName ?? "").trim();
      email = (body.email ?? "").trim().toLowerCase();
      phone = body.phone ?? null;
      location = body.location ?? null;
      linkedinUrl = body.linkedinUrl ?? null;
      portfolioUrl = body.portfolioUrl ?? null;
      githubUrl = body.githubUrl ?? null;
      coverLetter = body.coverLetter ?? null;
      cvUrl = body.cvUrl ?? null;
      source = body.source ?? null;
      howHeard = body.howHeard ?? null;
      noticePeriod = body.noticePeriod ?? null;
      currentGrossAnnual = body.currentGrossAnnual ?? null;
      grossAnnualExpectation = body.grossAnnualExpectation ?? null;
    } else {
      const formData = await req.formData();

      const getStr = (key: string): string | null => {
        const v = formData.get(key);
        if (v == null) return null;
        return String(v).trim() || null;
      };

      jobId = getStr("jobId");

      fullName = getStr("fullName") || "";
      email = (getStr("email") || "").toLowerCase();
      phone = getStr("phone");
      location = getStr("location");
      linkedinUrl = getStr("linkedinUrl") || getStr("linkedin");
      portfolioUrl = getStr("portfolioUrl");
      githubUrl = getStr("githubUrl");
      coverLetter = getStr("coverLetter");
      source = getStr("source");
      howHeard = getStr("howHeard");
      noticePeriod = getStr("noticePeriod");
      currentGrossAnnual = getStr("currentGrossAnnual");
      grossAnnualExpectation = getStr("grossAnnualExpectation");
      cvUrl = getStr("cvUrl");

      // If a file is sent under "cv", plug in Supabase / S3 upload here later.
      const cvFile = formData.get("cv") as File | null;
      if (cvFile) {
        // TODO: upload and set cvUrl to public URL.
        // For now we ignore the raw file and rely on cvUrl if provided.
      }
    }

    if (!jobId) {
      return NextResponse.json(
        { success: false, error: "Missing jobId." },
        { status: 400 },
      );
    }

    if (!fullName || !email) {
      return NextResponse.json(
        {
          success: false,
          error: "Name and email are required.",
        },
        { status: 400 },
      );
    }

    // Ensure job exists, is public, open, and not internal-only
    const job = await prisma.job.findFirst({
      where: {
        id: jobId,
        tenantId: tenant.id,
        visibility: "public",
        status: "open",
        internalOnly: false,
      },
    });

    if (!job) {
      return NextResponse.json(
        {
          success: false,
          error: "This role is not accepting applications or was not found.",
        },
        { status: 404 },
      );
    }

    // Candidate: find by (tenantId, email) or create
    const existingCandidate = await prisma.candidate.findFirst({
      where: {
        tenantId: job.tenantId,
        email,
      },
    });

    const candidate =
      existingCandidate ??
      (await prisma.candidate.create({
        data: {
          tenantId: job.tenantId,
          fullName,
          email,
          phone,
          location,
          linkedinUrl,
          currentTitle: null,
          currentCompany: null,
          cvUrl,
          source,
        },
      }));

    // Optionally keep candidate profile fresh
    const shouldUpdateCandidate =
      !existingCandidate ||
      candidate.fullName !== fullName ||
      candidate.phone !== phone ||
      candidate.location !== location ||
      candidate.linkedinUrl !== linkedinUrl ||
      candidate.cvUrl !== cvUrl;

    if (shouldUpdateCandidate) {
      await prisma.candidate.update({
        where: { id: candidate.id },
        data: {
          fullName,
          phone,
          location,
          linkedinUrl,
          cvUrl,
          source,
        },
      });
    }

    // Create JobApplication
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
        githubUrl,
        cvUrl,
        coverLetter,
        source,
        howHeard,
        noticePeriod,
        currentGrossAnnual,
        grossAnnualExpectation,
        // stage / status defaults from schema
      },
    });

    return NextResponse.json(
      {
        success: true,
        applicationId: application.id,
        message: "Application received.",
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("POST /api/jobs/apply error", err);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to submit application.",
      },
      { status: 500 },
    );
  }
}
