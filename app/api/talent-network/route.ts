// app/api/talent-network/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getResourcinTenant } from "@/lib/tenant";

type IncomingSkill = {
  name: string;
  proficiency?: number;      // 1–5
  yearsExperience?: number;  // integer
};

type TalentNetworkPayload = {
  fullName: string;
  email: string;
  phone?: string;
  location?: string;
  currentTitle?: string;
  currentCompany?: string;
  linkedinUrl?: string;
  headline?: string;
  summary?: string;
  skills?: IncomingSkill[];
  sourceLabel?: string;      // e.g. "Talent Network", "Sourcing Drive – Lagos"
};

// Normalise to a URL-safe, tenant-scoped skill key
function slugify(input: string): string {
  return input
    .toString()
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export async function POST(req: Request) {
  try {
    const tenant = await getResourcinTenant();

    if (!tenant) {
      return NextResponse.json(
        { success: false, error: "No default tenant configured." },
        { status: 500 },
      );
    }

    const body = (await req.json().catch(() => null)) as
      | TalentNetworkPayload
      | null;

    if (!body) {
      return NextResponse.json(
        { success: false, error: "Invalid JSON body." },
        { status: 400 },
      );
    }

    const fullName = (body.fullName || "").trim();
    const email = (body.email || "").trim().toLowerCase();

    if (!fullName || !email) {
      return NextResponse.json(
        {
          success: false,
          error: "fullName and email are required for the Talent Network.",
        },
        { status: 400 },
      );
    }

    // -------------------------------------------------------------------
    // 1) Upsert candidate for this tenant + email
    // -------------------------------------------------------------------
    let candidate = await prisma.candidate.findFirst({
      where: {
        tenantId: tenant.id,
        email,
      },
    });

    if (!candidate) {
      candidate = await prisma.candidate.create({
        data: {
          tenantId: tenant.id,
          fullName,
          email,
          phone: body.phone?.trim() || null,
          location: body.location?.trim() || null,
          linkedinUrl: body.linkedinUrl?.trim() || null,
          currentTitle: body.currentTitle?.trim() || null,
          currentCompany: body.currentCompany?.trim() || null,
          source: "talent_network",
        },
      });
    } else {
      candidate = await prisma.candidate.update({
        where: { id: candidate.id },
        data: {
          fullName,
          phone: body.phone?.trim() || candidate.phone,
          location: body.location?.trim() || candidate.location,
          linkedinUrl: body.linkedinUrl?.trim() || candidate.linkedinUrl,
          currentTitle: body.currentTitle?.trim() || candidate.currentTitle,
          currentCompany:
            body.currentCompany?.trim() || candidate.currentCompany,
          // Do not erase an existing richer source – just backfill if empty
          source: candidate.source ?? "talent_network",
        },
      });
    }

    // -------------------------------------------------------------------
    // 2) Map skills → Skill + CandidateSkill
    // -------------------------------------------------------------------
    const incomingSkills = Array.isArray(body.skills) ? body.skills : [];

    for (const raw of incomingSkills) {
      const name = (raw.name || "").trim();
      if (!name) continue;

      const skillSlug = slugify(name);

      // Prefer a tenant-local skill; fall back to global (tenantId = null)
      let skill = await prisma.skill.findFirst({
        where: {
          OR: [
            { tenantId: tenant.id, slug: skillSlug },
            { tenantId: null, slug: skillSlug },
          ],
        },
      });

      if (!skill) {
        // Create tenant-scoped skill
        skill = await prisma.skill.create({
          data: {
            tenantId: tenant.id,
            name,
            slug: skillSlug,
            category: null,
            description: null,
            externalSource: null,
            externalId: null,
          },
        });
      } else if (skill.tenantId === tenant.id && skill.name !== name) {
        // Keep local display-name fresh for tenant-scoped skills
        await prisma.skill.update({
          where: { id: skill.id },
          data: { name },
        });
      }

      const proficiency =
        typeof raw.proficiency === "number" &&
        Number.isFinite(raw.proficiency)
          ? raw.proficiency
          : null;

      const yearsExperience =
        typeof raw.yearsExperience === "number" &&
        Number.isInteger(raw.yearsExperience)
          ? raw.yearsExperience
          : null;

      // Manual "upsert" without relying on a composite unique in Prisma types
      const existingCandidateSkill = await prisma.candidateSkill.findFirst({
        where: {
          candidateId: candidate.id,
          skillId: skill.id,
        },
      });

      if (existingCandidateSkill) {
        await prisma.candidateSkill.update({
          where: { id: existingCandidateSkill.id },
          data: {
            proficiency: proficiency ?? undefined,
            yearsExperience: yearsExperience ?? undefined,
            source: "talent_network",
          },
        });
      } else {
        await prisma.candidateSkill.create({
          data: {
            tenantId: tenant.id,
            candidateId: candidate.id,
            skillId: skill.id,
            proficiency,
            yearsExperience,
            source: "talent_network",
          },
        });
      }
    }

    // -------------------------------------------------------------------
    // 3) Tag candidate with a SOURCE tag (kind = "SOURCE")
    // -------------------------------------------------------------------
    const sourceLabel = (body.sourceLabel || "Talent Network").trim();

    if (sourceLabel) {
      const sourceTag = await prisma.tag.upsert({
        where: {
          tenantId_name_kind: {
            tenantId: tenant.id,
            name: sourceLabel,
            kind: "SOURCE",
          },
        },
        update: {},
        create: {
          tenantId: tenant.id,
          name: sourceLabel,
          kind: "SOURCE",
          color: "#2563EB", // soft blue – adjust in UI if needed
          isSystem: true,
        },
      });

      await prisma.candidateTag.upsert({
        where: {
          candidateId_tagId: {
            candidateId: candidate.id,
            tagId: sourceTag.id,
          },
        },
        update: {},
        create: {
          tenantId: tenant.id,
          candidateId: candidate.id,
          tagId: sourceTag.id,
        },
      });
    }

    return NextResponse.json({
      success: true,
      candidateId: candidate.id,
      message:
        "Thanks – you’ve been added to our talent network and your skills are now searchable.",
    });
  } catch (err) {
    console.error("POST /api/talent-network error", err);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to join talent network. Please try again shortly.",
      },
      { status: 500 },
    );
  }
}
