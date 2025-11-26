// app/api/jobs/apply/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getResourcinTenant } from "@/lib/tenant";

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") || "";
    let jobId: string | null = null;

    let payload: any = {};

    if (contentType.includes("application/json")) {
      payload = await req.json();
      jobId =
        typeof payload.jobId === "string" && payload.jobId.trim().length > 0
          ? payload.jobId.trim()
          : null;
    } else {
      const formData = await req.formData();
      const getStr = (key: string): string | null => {
        const v = formData.get(key);
        if (v == null) return null;
        const s = String(v).trim();
        return s || null;
      };

      jobId = getStr("jobId");

      payload = {
        fullName: getStr("fullName"),
        email: getStr("email")?.toLowerCase(),
        phone: getStr("phone"),
        location: getStr("location"),
        linkedinUrl: getStr("linkedinUrl") ?? getStr("linkedin"),
        portfolioUrl: getStr("portfolioUrl"),
        githubUrl: getStr("githubUrl"),
        coverLetter: getStr("coverLetter"),
        cvUrl: getStr("cvUrl"),
        source: getStr("source"),
        howHeard: getStr("howHeard"),
        noticePeriod: getStr("noticePeriod"),
        currentGrossAnnual: getStr("currentGrossAnnual"),
        grossAnnualExpectation: getStr("grossAnnualExpectation"),
      };
    }

    if (!jobId) {
      return NextResponse.json(
        { success: false, error: "Missing jobId." },
        { status: 400 },
      );
    }

    const tenant = await getResourcinTenant();

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
          error:
            "This role is not accepting applications or was not found.",
        },
        { status: 404 },
      );
    }

    const fullName = (payload.fullName ?? "").trim();
    const email = (payload.email ?? "").trim().toLowerCase();

    if (!fullName || !email) {
      return NextResponse.json(
        {
          success: false,
          error: "Name and email are required.",
        },
        { status: 400 },
      );
    }

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
          phone: payload.phone ?? null,
          location: payload.location ?? null,
          linkedinUrl: payload.linkedinUrl ?? null,
          currentTitle: null,
          currentCompany: null,
          cvUrl: payload.cvUrl ?? null,
          source: payload.source ?? null,
        },
      }));

    const shouldUpdateCandidate =
      !existingCandidate ||
      candidate.fullName !== fullName ||
      candidate.phone !== (payload.phone ?? null) ||
      candidate.location !== (payload.location ?? null) ||
      candidate.linkedinUrl !== (payload.linkedinUrl ?? null) ||
      candidate.cvUrl !== (payload.cvUrl ?? null);

    if (shouldUpdateCandidate) {
      await prisma.candidate.update({
        where: { id: candidate.id },
        data: {
          fullName,
          phone: payload.phone ?? null,
          location: payload.location ?? null,
          linkedinUrl: payload.linkedinUrl ?? null,
          cvUrl: payload.cvUrl ?? null,
          source: payload.source ?? null,
        },
      });
    }

    const application = await prisma.jobApplication.create({
      data: {
        jobId: job.id,
        candidateId: candidate.id,
        fullName,
        email,
        phone: payload.phone ?? null,
        location: payload.location ?? null,
        linkedinUrl: payload.linkedinUrl ?? null,
        portfolioUrl: payload.portfolioUrl ?? null,
        githubUrl: payload.githubUrl ?? null,
        cvUrl: payload.cvUrl ?? null,
        coverLetter: payload.coverLetter ?? null,
        source: payload.source ?? null,
        howHeard: payload.howHeard ?? null,
        noticePeriod: payload.noticePeriod ?? null,
        currentGrossAnnual: payload.currentGrossAnnual ?? null,
        grossAnnualExpectation: payload.grossAnnualExpectation ?? null,
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
