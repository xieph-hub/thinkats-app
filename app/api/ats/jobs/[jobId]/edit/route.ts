// app/api/ats/jobs/[jobId]/edit/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type EditJobPayload = {
  title?: string;
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

  // Array of skill names coming from the form
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

export async function POST(
  req: NextRequest,
  { params }: { params: { jobId: string } },
) {
  try {
    const jobId = params.jobId;

    const existingJob = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        skills: true, // JobSkill rows
      },
    });

    if (!existingJob) {
      return NextResponse.json(
        { ok: false, error: "Job not found" },
        { status: 404 },
      );
    }

    const body = (await req.json().catch(() => null)) as EditJobPayload | null;
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { ok: false, error: "Invalid JSON body." },
        { status: 400 },
      );
    }

    const {
      title,
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
      requiredSkills,
    } = body;

    const data: any = {};

    if (typeof title === "string" && title.trim()) {
      data.title = title.trim();
      // keep slug aligned if changed
      data.slug = slugify(title);
    }

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

    if (salaryMin !== undefined && salaryMin !== null) {
      data.salaryMin = salaryMin;
    }
    if (salaryMax !== undefined && salaryMax !== null) {
      data.salaryMax = salaryMax;
    }
    if (salaryCurrency !== undefined) data.salaryCurrency = salaryCurrency;
    if (salaryVisible !== undefined && salaryVisible !== null) {
      data.salaryVisible = salaryVisible;
    }

    if (status !== undefined) data.status = status;
    if (visibility !== undefined) data.visibility = visibility;
    if (clientCompanyId !== undefined) data.clientCompanyId = clientCompanyId;

    // 1) Update core job fields
    const updatedJob = await prisma.job.update({
      where: { id: jobId },
      data,
    });

    // 2) Map required skill names -> Skills + JobSkill rows
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

        // avoid duplicate work within this payload
        if (normalizedToSkillId.has(normalizedName)) continue;

        const skillSlug = slugify(name);

        let skill = await prisma.skill.findFirst({
          where: {
            OR: [
              {
                tenantId: existingJob.tenantId,
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
          // Create tenant-scoped skill with normalizedName
          skill = await prisma.skill.create({
            data: {
              tenantId: existingJob.tenantId,
              name,
              normalizedName,
              slug: skillSlug,
              category: null,
              description: null,
              externalSource: null,
              externalId: null,
              isGlobal: false,
            },
          });
        } else if (
          skill.tenantId === existingJob.tenantId &&
          skill.name !== name
        ) {
          // Keep local display-name fresh for tenant-scoped skills
          await prisma.skill.update({
            where: { id: skill.id },
            data: { name },
          });
        }

        normalizedToSkillId.set(normalizedName, skill.id);
      }

      // Replace JobSkill rows for this job
      await prisma.jobSkill.deleteMany({
        where: {
          tenantId: existingJob.tenantId,
          jobId: existingJob.id,
        },
      });

      const jobSkillData = Array.from(normalizedToSkillId.values()).map(
        (skillId) => ({
          tenantId: existingJob.tenantId,
          jobId: existingJob.id,
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

      // keep the denormalized text array in sync too
      await prisma.job.update({
        where: { id: existingJob.id },
        data: {
          requiredSkills: incomingSkillNames,
        },
      });
    }

    return NextResponse.json({
      ok: true,
      jobId: updatedJob.id,
    });
  } catch (err) {
    console.error("POST /api/ats/jobs/[jobId]/edit error", err);
    return NextResponse.json(
      { ok: false, error: "Failed to update job." },
      { status: 500 },
    );
  }
}
