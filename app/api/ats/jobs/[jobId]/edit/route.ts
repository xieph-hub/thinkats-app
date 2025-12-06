import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Generic slug helper for both jobs and skills
function slugify(raw: string): string {
  return raw
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseDecimal(value: FormDataEntryValue | null): any {
  if (!value || typeof value !== "string") return null;
  const cleaned = value.trim().replace(/,/g, "");
  if (!cleaned) return null;
  const num = Number(cleaned);
  if (Number.isNaN(num)) return null;
  return num as any;
}

function parseCsv(input: string | null): string[] {
  if (!input) return [];
  return input
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

export async function POST(
  req: Request,
  { params }: { params: { jobId: string } },
) {
  try {
    const jobId = params.jobId;

    if (!jobId) {
      return NextResponse.json(
        { success: false, error: "Missing jobId." },
        { status: 400 },
      );
    }

    const existingJob = await prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!existingJob) {
      return NextResponse.json(
        {
          success: false,
          error: "Job not found.",
        },
        { status: 404 },
      );
    }

    const formData = await req.formData();

    const getStr = (key: string): string | null => {
      const v = formData.get(key);
      if (typeof v !== "string") return null;
      const trimmed = v.trim();
      return trimmed.length ? trimmed : null;
    };

    const title = getStr("title");
    if (!title) {
      return NextResponse.json(
        {
          success: false,
          error: "Job title is required.",
        },
        { status: 400 },
      );
    }

    const department = getStr("department");
    const location = getStr("location");
    const locationType = getStr("locationType");
    const employmentType = getStr("employmentType");
    const experienceLevel = getStr("experienceLevel");
    const workMode = getStr("workMode");
    const shortDescription = getStr("shortDescription");
    const overview = getStr("overview");
    const aboutClient = getStr("aboutClient");
    const responsibilities = getStr("responsibilities");
    const requirements = getStr("requirements");
    const benefits = getStr("benefits");
    const salaryCurrency = getStr("salaryCurrency");
    const externalId = getStr("externalId");

    const statusRaw = getStr("status");
    const status = statusRaw || (existingJob as any).status || "open";

    const salaryMin = parseDecimal(formData.get("salaryMin"));
    const salaryMax = parseDecimal(formData.get("salaryMax"));

    const salaryVisible = formData.get("salaryVisible") === "on";

    const visibilityMode = getStr("visibilityMode") || "public";
    const isInternal = visibilityMode === "internal";
    const visibility = isInternal ? "internal" : "public";
    const internalOnly = isInternal;

    const confidential = formData.get("confidential") === "on";

    const clientCompanyIdRaw = getStr("clientCompanyId");
    const clientCompanyId = clientCompanyIdRaw || null;

    const tags = parseCsv(getStr("tags"));
    const requiredSkills = parseCsv(getStr("requiredSkills"));

    const slugFieldRaw = formData.get("slug");
    const slugField = typeof slugFieldRaw === "string" ? slugFieldRaw.trim() : "";
    let finalSlug = existingJob.slug as string | null;

    if (slugField === "") {
      // Explicitly clear slug
      finalSlug = null;
    } else if (slugField.length > 0) {
      const baseSlug = slugify(slugField);
      if (baseSlug) {
        let candidateSlug = baseSlug;
        let suffix = 1;

        while (true) {
          const collision = await prisma.job.findFirst({
            where: {
              tenantId: existingJob.tenantId,
              slug: candidateSlug,
              NOT: { id: existingJob.id },
            },
          });

          if (!collision) {
            finalSlug = candidateSlug;
            break;
          }

          suffix += 1;
          candidateSlug = `${baseSlug}-${suffix}`;
        }
      } else {
        finalSlug = null;
      }
    }

    // -------------------------------------------------------------------
    // 1) Update the Job record (string arrays stay as source-of-truth)
    // -------------------------------------------------------------------
    await prisma.job.update({
      where: { id: jobId },
      data: {
        title,
        department,
        location,
        locationType,
        employmentType,
        experienceLevel,
        workMode,
        shortDescription,
        overview,
        aboutClient,
        responsibilities,
        requirements,
        benefits,
        salaryCurrency,
        salaryMin,
        salaryMax,
        salaryVisible,
        status,
        visibility,
        internalOnly,
        confidential,
        externalId,
        clientCompanyId,
        tags,
        requiredSkills,
        slug: finalSlug,
      },
    });

    // -------------------------------------------------------------------
    // 2) Synchronise JobSkill with requiredSkills[]
    //    - For each requiredSkill string, ensure there is a Skill row.
    //    - Then attach JobSkill rows for this job.
    // -------------------------------------------------------------------

    const tenantId = existingJob.tenantId;

    // Normalise to a deduplicated list of skill names
    const normalizedSkillNames = Array.from(
      new Set(
        requiredSkills
          .map((name) => name.trim())
          .filter((name) => name.length > 0),
      ),
    );

    if (normalizedSkillNames.length > 0) {
      // 2a) Look up or create Skill rows for each name
      const skillRecords: { id: string }[] = [];

      for (const name of normalizedSkillNames) {
        const skillSlug = slugify(name);
        if (!skillSlug) continue;

        // Try to reuse an existing tenant-specific or global skill
        const existingSkill = await prisma.skill.findFirst({
          where: {
            OR: [
              { tenantId, slug: skillSlug },
              { tenantId: null, slug: skillSlug },
            ],
          },
          select: { id: true },
        });

        if (existingSkill) {
          skillRecords.push({ id: existingSkill.id });
        } else {
          const created = await prisma.skill.create({
            data: {
              tenantId,           // tenant-scoped skill
              name,
              slug: skillSlug,
              externalSource: null,
              externalId: null,
              description: null,
              category: null,
            },
            select: { id: true },
          });
          skillRecords.push({ id: created.id });
        }
      }

      // 2b) Wipe existing JobSkill rows for this job and recreate
      await prisma.jobSkill.deleteMany({
        where: {
          tenantId,
          jobId,
        },
      });

      if (skillRecords.length > 0) {
        await prisma.jobSkill.createMany({
          data: skillRecords.map((skill) => ({
            tenantId,
            jobId,
            skillId: skill.id,
            importance: null,
            isRequired: true,
          })),
        });
      }
    } else {
      // If no requiredSkills, clear JobSkill entries for this job
      await prisma.jobSkill.deleteMany({
        where: {
          tenantId,
          jobId,
        },
      });
    }

    const redirectUrl = new URL(`/ats/jobs/${jobId}`, req.url);
    return NextResponse.redirect(redirectUrl);
  } catch (err) {
    console.error("POST /api/ats/jobs/[jobId]/edit error", err);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update job.",
      },
      { status: 500 },
    );
  }
}
