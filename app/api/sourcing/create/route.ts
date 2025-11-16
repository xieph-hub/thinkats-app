import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

// Default tenant (same idea as we used in /api/apply)
const DEFAULT_TENANT_ID = process.env.DEFAULT_TENANT_ID ?? "default-tenant";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      fullName,
      email,
      phone,
      // we accept everything but only persist what the schema actually has for now
      headline,
      summary,
      currentRole,
      currentCompany,
      functions,
      industries,
      skills,
      preferredLocations,
      workPreference,
      cvUrl,
    } = body as {
      fullName?: string;
      email?: string;
      phone?: string;
      headline?: string;
      summary?: string;
      currentRole?: string;
      currentCompany?: string;
      functions?: string;
      industries?: string;
      skills?: string | string[];
      preferredLocations?: string;
      workPreference?: string;
      cvUrl?: string;
    };

    if (!fullName || !email) {
      return NextResponse.json(
        { error: "fullName and email are required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Normalise skills into a string[]
    const rawSkills = skills as unknown;
    const parsedSkills =
      typeof rawSkills === "string"
        ? rawSkills
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : Array.isArray(rawSkills)
        ? rawSkills.map((s) => String(s).trim()).filter(Boolean)
        : [];

    // Try to find existing candidate for this tenant + email
    const existingCandidate = await prisma.candidate.findFirst({
      where: {
        email: normalizedEmail,
        tenantId: DEFAULT_TENANT_ID,
      },
      select: { id: true },
    });

    // Only use fields we’re confident exist on Candidate right now.
    // If some of these cause new TS errors, we can shave it down further,
    // but this should align with the schema we’ve been using so far.
    const baseData = {
      fullName,
      email: normalizedEmail,
      phone: phone ?? null,
      headline: headline ?? null,
      summary: summary ?? null,
      currentCompany: currentCompany ?? null,
      // currentRole from the form can be mapped into currentTitle in the DB (if you have that field)
      currentTitle: currentRole ?? null,
      functions: functions ?? null,
      industries: industries ?? null,
      skills: parsedSkills,
      preferredLocations: preferredLocations ?? null,
      workPreference: workPreference ?? null,
      cvUrl: cvUrl ?? null,
    };

    let candidate;

    if (existingCandidate) {
      candidate = await prisma.candidate.update({
        where: { id: existingCandidate.id },
        data: baseData,
      });
    } else {
      candidate = await prisma.candidate.create({
        data: {
          tenantId: DEFAULT_TENANT_ID,
          ...baseData,
        },
      });
    }

    return NextResponse.json(
      {
        ok: true,
        candidateId: candidate.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in /api/sourcing/create", error);
    return NextResponse.json(
      {
        error: "Something went wrong creating sourced candidate",
      },
      { status: 500 }
    );
  }
}
