// app/api/ats/jobs/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getResourcinTenant } from "@/lib/tenant";

type CreateJobPayload = {
  title: string;
  department?: string | null;
  location?: string | null;
  employmentType?: string | null;
  seniority?: string | null;
  description?: string | null;
  overview?: string | null;
  aboutClient?: string | null;
  responsibilities?: string | null;
  requirements?: string | null;
  benefits?: string | null;
  locationType?: string | null;
  experienceLevel?: string | null;
  yearsExperienceMin?: number | null;
  yearsExperienceMax?: number | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  salaryCurrency?: string | null;
  salaryVisible?: boolean | null;
  status?: string;
  visibility?: string;
  clientCompanyId?: string | null;
  workMode?: string | null;
  internalOnly?: boolean | null;
  confidential?: boolean | null;
  shortDescription?: string | null;
  educationRequired?: string | null;
  educationField?: string | null;

  // list of skill display-names from the form
  requiredSkills?: string[];
};

function slugify(raw: string): string {
  return raw
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function normaliseSkillName(raw: string): string {
  return raw.trim().toLowerCase();
}

// ---------------------------------------------------------------------
// GET – lightweight jobs listing (for any consumers using this API)
// ---------------------------------------------------------------------
export async function GET(req: NextRequest) {
  try {
    const tenant = await getResourcinTenant();
    if (!tenant) {
      return NextResponse.json(
        { ok: false, error: "No default tenant configured." },
        { status: 500 },
      );
    }

    const url = new URL(req.url);
    const q = url.searchParams.get("q") || "";
    const status = url.searchParams.get("status") || "";

    const where: any = {
      tenantId: tenant.id,
    };

    if (q) {
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { department: { contains: q, mode: "insensitive" } },
        { location: { contains: q, mode: "insensitive" } },
      ];
    }

    if (status) {
      where.status = status;
    }

    const jobs = await prisma.job.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ ok: true, jobs });
  } catch (err) {
    console.error("GET /api/ats/jobs error", err);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch jobs." },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------
// POST – create a new ATS job + wire requiredSkills → Skill/JobSkill
// ---------------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    const tenant = await getResourcinTenant();
    if (!tenant) {
      return NextResponse.json(
        { ok: false, error: "No default tenant configured." },
        { status: 500 },
      );
    }

    const body = (await req.json().catch(() => null)) as
      | CreateJobPayload
      | null;

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { ok: false, error: "Invalid JSON body." },
        { status: 400 },
      );
    }

    const title = (body.title || "").trim();
    if (!title) {
      return NextResponse.json(
        { ok: false, error: "Title is required." },
        { status: 400 },
      );
    }

    const slug = slugify(title);

    const {
      department,
      location,
      employmentType,
      seniority,
      description,
      overview,
      aboutClient,
      responsibilities,
      requirements,
      benefits,
      locationType,
      experienceLevel,
      yearsExperienceMin,
      yearsExperienceMax,
      salaryMin,
      salaryMax,
      salaryCurrency,
      salaryVisible,
      status,
      visibility,
      clientCompanyId,
      workMode,
      internalOnly,
      confidential,
      shortDescription,
      educationRequired,
      educationField,
      requiredSkills,
    } = body;

    const data: any = {
      tenantId: tenant.id,
      title,
      slug,
      status: status ?? "open",
      visibility: visibility ?? "public",
    };

    if (department !== undefined) data.department = department;
    if (location !== undefined) data.location = location;
    if (employmentType !== undefined) data.employmentType = employmentType;
    if (seniority !== undefined) data.seniority = seniority;
    if (description !== undefined) data.description = description;
    if (overview !== undefined) data.overview = overview;
    if (aboutClient !== undefined) data.aboutClient = aboutClient;
    if (responsibilities !== undefined) data.responsibilities = responsibilities;
    if (requirements !== undefined) data.requirements = requirements;
    if (benefits !== undefined) data.benefits = benefits;
    if (locationType !== undefined) data.locationType = locationType;
    if (experienceLevel !== undefined) data.experienceLevel = experienceLevel;
    if (yearsExperienceMin !== undefined)
      data.yearsExperienceMin = yearsExperienceMin;
    if (yearsExperienceMax !== undefined)
      data.yearsExperienceMax = yearsExperienceMax;
    if (salaryMin !== undefined && salaryMin !== null) data.salaryMin = salaryMin;
    if (salaryMax !== undefined && salaryMax !== null) data.salaryMax = salaryMax;
    if (salaryCurrency !== undefined) data.salaryCurrency = salaryCurrency;
    if (salaryVisible !== undefined && salaryVisible !== null)
      data.salaryVisible = salaryVisible;
    if (clientCompanyId !== undefined) data.clientCompanyId = clientCompanyId;
    if (workMode !== undefined) data.workMode = workMode;
    if (internalOnly !== undefined && internalOnly !== null)
      data.internalOnly = internalOnly;
    if (confidential !== undefined && confidential !== null)
      data.confidential = confidential;
    if (shortDescription !== undefined) data.shortDescription = shortDescription;
    if (educationRequired !== undefined)
      data.educationRequired = educationRequired;
    if (educationField !== undefined) data.educationField = educationField;

    // 1) Create job row
    const job = await prisma.job.create({
      data,
    });

    // 2) Create a simple default pipeline for this job
    const defaultStages = [
      "APPLIED",
      "SCREEN",
      "INTERVIEW",
      "OFFER",
      "HIRED",
    ];

    await prisma.jobStage.createMany({
      data: defaultStages.map((name, index) => ({
        tenantId: tenant.id,
        jobId: job.id,
        name,
        position: index + 1,
        isTerminal: name === "HIRED",
      })),
      skipDuplicates: true,
    });

    // 3) Map requiredSkills → Skill / JobSkill
    const incomingSkillNames: string[] = Array.isArray(requiredSkills)
      ? requiredSkills
          .filter((s) => typeof s === "string")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

    if (incomingSkillNames.length > 0) {
      const normalizedToSkillId = new Map<string, string>();

      for (const name of incomingSkillNames) {
        const normalizedName = normaliseSkillName(name);
        if (!normalizedName) continue;
        if (normalizedToSkillId.has(normalizedName)) continue;

        const skillSlug = slugify(name);

        let skill = await prisma.skill.findFirst({
          where: {
            OR: [
              {
                tenantId: tenant.id,
                normalizedName,
              },
              {
                tenantId: null,
                normalizedName,
              },
            ],
          },
        });

        if (!skill) {
          // Use the relation-based API so Prisma's type system stays happy
          skill = await prisma.skill.create({
            data: {
              name,
              normalizedName,
              slug: skillSlug,
              category: null,
              description: null,
              externalSource: null,
              externalId: null,
              isGlobal: false,
              tenant: {
                connect: { id: tenant.id },
              },
            },
          });
        } else if (skill.tenantId === tenant.id && skill.name !== name) {
          // Keep local display name fresh
          await prisma.skill.update({
            where: { id: skill.id },
            data: { name },
          });
        }

        normalizedToSkillId.set(normalizedName, skill.id);
      }

      const jobSkillData = Array.from(normalizedToSkillId.values()).map(
        (skillId) => ({
          tenantId: tenant.id,
          jobId: job.id,
          skillId,
          importance: 3,
          isRequired: true,
        }),
      );

      if (jobSkillData.length > 0) {
        await prisma.jobSkill.createMany({
          data: jobSkillData,
          skipDuplicates: true,
        });
      }

      // Keep text-array version in sync for simple filters
      await prisma.job.update({
        where: { id: job.id },
        data: { requiredSkills: incomingSkillNames },
      });
    }

    return NextResponse.json({ ok: true, jobId: job.id });
  } catch (err) {
    console.error("POST /api/ats/jobs error", err);
    return NextResponse.json(
      { ok: false, error: "Failed to create job." },
      { status: 500 },
    );
  }
}
