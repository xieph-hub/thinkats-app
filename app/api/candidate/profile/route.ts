// app/api/candidate/profile/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentCandidate } from "@/lib/auth-candidate";

export async function PUT(req: NextRequest) {
  try {
    const candidate = await getCurrentCandidate();
    if (!candidate) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const body = await req.json();

    const {
      fullName,
      phone,
      location,
      linkedinUrl,
      yearsOfExperience,
      currentRole,
      currentCompany,
      primaryFunction,
      seniority,
      skills,
    } = body;

    // Sanitise / basic parsing
    const skillsArray: string[] =
      typeof skills === "string"
        ? skills
            .split(",")
            .map((s: string) => s.trim())
            .filter(Boolean)
        : Array.isArray(skills)
          ? skills
          : [];

    const years =
      typeof yearsOfExperience === "number"
        ? yearsOfExperience
        : yearsOfExperience
        ? parseInt(String(yearsOfExperience), 10)
        : null;

    const updated = await prisma.candidate.update({
      where: { id: candidate.id },
      data: {
        fullName: fullName || candidate.fullName,
        phone: phone ?? candidate.phone,
        location: location ?? candidate.location,
        linkedinUrl: linkedinUrl ?? candidate.linkedinUrl,
        yearsOfExperience: years ?? candidate.yearsOfExperience,
        currentRole: currentRole ?? candidate.currentRole,
        currentCompany: currentCompany ?? candidate.currentCompany,
        primaryFunction: primaryFunction ?? candidate.primaryFunction,
        seniority: seniority ?? candidate.seniority,
        skills: skillsArray.length ? skillsArray : candidate.skills,
      },
    });

    return NextResponse.json({ ok: true, candidate: updated });
  } catch (error) {
    console.error("Error updating candidate profile", error);
    return NextResponse.json(
      { error: "Failed to update profile." },
      { status: 500 }
    );
  }
}
