import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      fullName,
      email,
      phone,
      city,
      country,
      headline,
      summary,
      currentRole,
      currentCompany,
      totalExperienceYears,
      level,
      functions,
      industries,
      skills,
      preferredLocations,
      workPreference,
      salaryCurrency,
      salaryMin,
      salaryMax,
      noticePeriod,
      cvUrl,
      source,
      location, // fallback if a single location string is sent
    } = body as {
      fullName?: string;
      email?: string;
      phone?: string;
      city?: string;
      country?: string;
      headline?: string;
      summary?: string;
      currentRole?: string;
      currentCompany?: string;
      totalExperienceYears?: number;
      level?: string;
      functions?: string;
      industries?: string;
      skills?: string | string[];
      preferredLocations?: string;
      workPreference?: string;
      salaryCurrency?: string;
      salaryMin?: number;
      salaryMax?: number;
      noticePeriod?: string;
      cvUrl?: string;
      source?: string;
      location?: string;
    };
// Normalize skills into a string[]
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

    if (!fullName || !email) {
      return NextResponse.json(
        { error: "fullName and email are required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    const candidate = await prisma.candidate.create({
      data: {
        fullName,
        email: normalizedEmail,
        phone: phone ?? null,
        city: city ?? location ?? null,
        country: country ?? null,
        headline: headline ?? null,
        summary: summary ?? null,
        currentRole: currentRole ?? null,
        currentCompany: currentCompany ?? null,
        totalExperienceYears: totalExperienceYears ?? null,

        level: level ?? null,
        functions: functions ?? null,
        industries: industries ?? null,
        skills: parsedSkills, // <-- changed

        preferredLocations: preferredLocations ?? null,
        workPreference: workPreference ?? null,
        salaryCurrency: salaryCurrency ?? null,
        salaryMin: salaryMin ?? null,
        salaryMax: salaryMax ?? null,
        noticePeriod: noticePeriod ?? null,

        cvUrl: cvUrl ?? null,
        source: source ?? "sourcing",
        status: "active",
      },
    });

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
