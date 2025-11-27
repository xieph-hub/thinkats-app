// app/api/ats/jobs/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getResourcinTenant } from "@/lib/tenant";

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

function toStringOrNull(value: FormDataEntryValue | null): string | null {
  if (!value) return null;
  const s = value.toString().trim();
  return s.length ? s : null;
}

function parseNumberValue(value: FormDataEntryValue | null): number | null {
  if (!value) return null;
  const s = value.toString().replace(/,/g, "").trim();
  if (!s) return null;
  const n = Number(s);
  if (Number.isNaN(n)) return null;
  return n;
}

// Simple tags parser: accepts comma- or newline-separated entries
function parseTags(value: FormDataEntryValue | null): string[] {
  if (!value) return [];
  const raw = value.toString();
  return raw
    .split(/[,;\n]/)
    .map((v) => v.trim())
    .filter((v) => v.length > 0);
}

export async function POST(req: NextRequest) {
  try {
    const tenant = await getResourcinTenant();

    if (!tenant) {
      return NextResponse.json(
        { error: "No default tenant configured." },
        { status: 500 },
      );
    }

    const formData = await req.formData();

    const titleRaw = formData.get("title");
    const title = typeof titleRaw === "string" ? titleRaw.trim() : "";

    if (!title) {
      return NextResponse.json(
        { error: "Title is required." },
        { status: 400 },
      );
    }

    const clientCompanyId = toStringOrNull(formData.get("clientCompanyId"));

    const hiringManagerId = toStringOrNull(
      formData.get("hiringManagerId"),
    );

    // Job function / discipline (from dropdown)
    const jobFunction =
      toStringOrNull(formData.get("function")) ??
      toStringOrNull(formData.get("jobFunction"));

    const location = toStringOrNull(formData.get("location"));
    const locationType = toStringOrNull(formData.get("locationType"));
    const employmentType = toStringOrNull(formData.get("employmentType"));
    const experienceLevel = toStringOrNull(
      formData.get("experienceLevel"),
    );

    const shortDescription = toStringOrNull(
      formData.get("shortDescription"),
    );
    const overview = toStringOrNull(formData.get("overview"));
    const aboutClient = toStringOrNull(formData.get("aboutClient"));
    const responsibilities = toStringOrNull(
      formData.get("responsibilities"),
    );
    const requirements = toStringOrNull(formData.get("requirements"));
    const benefits = toStringOrNull(formData.get("benefits"));

    const statusRaw = toStringOrNull(formData.get("status"));
    const visibilityRaw = toStringOrNull(formData.get("visibility"));

    const status =
      statusRaw && ["draft", "open", "closed"].includes(statusRaw)
        ? statusRaw
        : "draft";

    const visibility =
      visibilityRaw && ["public", "internal"].includes(visibilityRaw)
        ? visibilityRaw
        : "public";

    const internalOnly = formData.get("internalOnly") === "on";
    const confidential = formData.get("confidential") === "on";
    const salaryVisible = formData.get("salaryVisible") === "on";

    const salaryMin = parseNumberValue(formData.get("salaryMin"));
    const salaryMax = parseNumberValue(formData.get("salaryMax"));
    const salaryCurrency =
      toStringOrNull(formData.get("salaryCurrency")) ?? "NGN";

    // Tags / skills
    const tags = parseTags(formData.get("tags"));

    // Slug generation (per tenant)
    const slugSource = toStringOrNull(formData.get("slug")) ?? title;
    const baseSlug = slugify(slugSource);
    let slug: string | null = baseSlug || null;

    if (slug) {
      const existing = await prisma.job.findFirst({
        where: {
          tenantId: tenant.id,
          slug,
        },
        select: { id: true },
      });

      if (existing) {
        slug = `${baseSlug}-${Date.now().toString(36)}`;
      }
    }

    const job = await prisma.job.create({
      data: {
        tenantId: tenant.id,
        clientCompanyId,
        title,
        slug,
        // core meta
        location,
        locationType,
        employmentType,
        experienceLevel,
        // discipline / function
        function: jobFunction ?? undefined,
        // narrative
        shortDescription,
        overview,
        aboutClient,
        responsibilities,
        requirements,
        benefits,
        // status & visibility
        status,
        visibility,
        internalOnly,
        confidential,
        // salary
        salaryMin,
        salaryMax,
        salaryCurrency,
        salaryVisible,
        // ownership
        hiringManagerId,
        // tags / skills
        tags,
      },
    });

    // Redirect to the ATS job pipeline view for this role
    const redirectUrl = new URL(
      `/ats/jobs/${job.id}`,
      req.url,
    ).toString();

    return NextResponse.redirect(redirectUrl, {
      status: 303,
    });
  } catch (error) {
    console.error("POST /api/ats/jobs error", error);
    return NextResponse.json(
      { error: "Failed to create job." },
      { status: 500 },
    );
  }
}
