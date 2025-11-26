// app/api/ats/jobs/[jobId]/edit/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

    const salaryVisible =
      formData.get("salaryVisible") === "on";

    const visibilityMode = getStr("visibilityMode") || "public";
    const isInternal = visibilityMode === "internal";
    const visibility = isInternal ? "internal" : "public";
    const internalOnly = isInternal;

    const confidential =
      formData.get("confidential") === "on";

    const clientCompanyIdRaw = getStr("clientCompanyId");
    const clientCompanyId = clientCompanyIdRaw || null;

    const tags = parseCsv(getStr("tags"));
    const requiredSkills = parseCsv(getStr("requiredSkills"));

    const slugFieldRaw = formData.get("slug");
    const slugField =
      typeof slugFieldRaw === "string"
        ? slugFieldRaw.trim()
        : "";
    let finalSlug = existingJob.slug as string | null;

    if (slugField === "") {
      finalSlug = null;
    } else if (slugField.length > 0) {
      const baseSlug = slugify(slugField);
      if (baseSlug) {
        let candidate = baseSlug;
        let suffix = 1;

        while (true) {
          const collision = await prisma.job.findFirst({
            where: {
              tenantId: existingJob.tenantId,
              slug: candidate,
              NOT: { id: existingJob.id },
            },
          });

          if (!collision) {
            finalSlug = candidate;
            break;
          }

          suffix += 1;
          candidate = `${baseSlug}-${suffix}`;
        }
      } else {
        finalSlug = null;
      }
    }

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
