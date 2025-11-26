// app/api/ats/jobs/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getResourcinTenant } from "@/lib/tenant";

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export async function POST(req: NextRequest) {
  try {
    const tenant = await getResourcinTenant();
    const body = await req.json();

    const {
      title,
      slug,
      clientCompanyId,
      location,
      employmentType,
      seniority,
      description,
      isPublic,
      isPublished,
      isConfidential,
    } = body;

    if (!title || typeof title !== "string") {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    let finalSlug = slug?.trim() || slugify(title);

    // Optional: ensure slug uniqueness per tenant
    if (finalSlug) {
      const existing = await prisma.job.findFirst({
        where: {
          tenantId: tenant.id,
          slug: finalSlug,
        },
        select: { id: true },
      });

      if (existing) {
        finalSlug = `${finalSlug}-${Date.now()}`;
      }
    }

    const job = await prisma.job.create({
      data: {
        tenantId: tenant.id,
        clientCompanyId: clientCompanyId || null,
        title,
        slug: finalSlug,
        location: location || null,
        employmentType: employmentType || null, // adjust if enum
        seniority: seniority || null,
        description: description || null,
        shortDescription: null,
        tags: [],
        isPublic: typeof isPublic === "boolean" ? isPublic : true,
        isPublished: typeof isPublished === "boolean" ? isPublished : false,
        isConfidential:
          typeof isConfidential === "boolean" ? isConfidential : false,
        status: "OPEN", // adjust if your enum differs
        publishedAt:
          typeof isPublished === "boolean" && isPublished ? new Date() : null,
      },
    });

    return NextResponse.json({ job }, { status: 201 });
  } catch (err) {
    console.error("POST /api/ats/jobs error", err);
    return NextResponse.json(
      { error: "Failed to create job" },
      { status: 500 }
    );
  }
}
