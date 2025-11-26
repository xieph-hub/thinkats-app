// app/api/jobs/[jobId]/apply/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const DEFAULT_TENANT_SLUG =
  process.env.RESOURCIN_TENANT_SLUG || "resourcin";

async function getDefaultTenantId() {
  if (process.env.RESOURCIN_TENANT_ID) {
    return process.env.RESOURCIN_TENANT_ID;
  }

  const tenant = await prisma.tenant.findFirst({
    where: { slug: DEFAULT_TENANT_SLUG },
  });

  if (!tenant) {
    throw new Error(
      `Default tenant not found for slug "${DEFAULT_TENANT_SLUG}". ` +
        `Create a tenant row in Supabase (tenants table) or set RESOURCIN_TENANT_ID.`,
    );
  }

  return tenant.id;
}

export async function POST(
  req: Request,
  { params }: { params: { jobId: string } },
) {
  try {
    const { jobId } = params;
    if (!jobId) {
      return NextResponse.json(
        { success: false, error: "Job ID is required in the URL." },
        { status: 400 },
      );
    }

    const body = await req.json();

    const {
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
      screeningAnswers,
      howHeard,
      workPermitStatus,
      grossAnnualExpectation,
      currentGrossAnnual,
      noticePeriod,
      gender,
      ethnicity,
      dataPrivacyConsent,
      termsConsent,
      marketingOptIn,
      referenceCode,
    } = body || {};

    // Basic validation
    if (!fullName || typeof fullName !== "string" || fullName.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: "Full name is required." },
        { status: 400 },
      );
    }

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { success: false, error: "Email is required." },
        { status: 400 },
      );
    }

    const tenantId = await getDefaultTenantId();

    // ------------------------------------------------------------------
    // 1) Look up the job (must belong to tenant, be public & open)
    // ------------------------------------------------------------------
    const job = await prisma.job.findFirst({
      where: {
        id: jobId,
        tenantId,
        visibility: "public",  // matches your Prisma `visibility` field
        status: "open",        // matches your Prisma default "open"
        internalOnly: false,   // don’t allow internal-only via public apply endpoint
      },
    });

    if (!job) {
      return NextResponse.json(
        {
          success: false,
          error: "This job is not accepting applications or does not exist.",
        },
        { status: 404 },
      );
    }

    // ------------------------------------------------------------------
    // 2) Find or create candidate for this tenant + email
    // ------------------------------------------------------------------
    const existingCandidate = await prisma.candidate.findFirst({
      where: {
        tenantId,
        email,
      },
    });

    const candidate =
      existingCandidate ??
      (await prisma.candidate.create({
        data: {
          tenantId,
          fullName,
          email,
          phone: phone ?? null,
          location: location ?? null,
          linkedinUrl: linkedinUrl ?? null,
          currentTitle: null,
          currentCompany: null,
          cvUrl: cvUrl ?? null,
          source: source ?? "job_application",
        },
      }));

    // ------------------------------------------------------------------
    // 3) Create job application
    // ------------------------------------------------------------------
    const application = await prisma.jobApplication.create({
      data: {
        jobId: job.id,
        candidateId: candidate.id,

        fullName,
        email,
        phone: phone ?? null,
        location: location ?? null,
        linkedinUrl: linkedinUrl ?? null,
        portfolioUrl: portfolioUrl ?? null,
        githubUrl: githubUrl ?? null,
        cvUrl: cvUrl ?? null,
        coverLetter: coverLetter ?? null,
        source: source ?? null,

        // Diversity / extra fields
        workPermitStatus: workPermitStatus ?? null,
        grossAnnualExpectation: grossAnnualExpectation ?? null,
        currentGrossAnnual: currentGrossAnnual ?? null,
        noticePeriod: noticePeriod ?? null,
        gender: gender ?? null,
        ethnicity: ethnicity ?? null,
        howHeard: howHeard ?? null,

        dataPrivacyConsent:
          typeof dataPrivacyConsent === "boolean"
            ? dataPrivacyConsent
            : null,
        termsConsent:
          typeof termsConsent === "boolean" ? termsConsent : null,
        marketingOptIn:
          typeof marketingOptIn === "boolean" ? marketingOptIn : null,

        referenceCode: referenceCode ?? null,
        screeningAnswers: screeningAnswers ?? null,

        // status & stage will default via DB:
        //   stage: 'APPLIED'
        //   status: 'PENDING'
      },
    });

    // (Optional) You could also insert an ApplicationEvent here, but
    // keeping it minimal to avoid breaking anything else.

    return NextResponse.json(
      {
        success: true,
        applicationId: application.id,
        message: "Application received.",
      },
      { status: 201 },
    );
  } catch (err: any) {
    console.error("POST /api/jobs/[jobId]/apply error", err);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to submit application.",
      },
      { status: 500 },
    );
  }
}
