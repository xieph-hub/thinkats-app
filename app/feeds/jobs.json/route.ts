// app/feeds/jobs.json/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function getBaseUrl(): string {
  const env = process.env.NEXT_PUBLIC_SITE_URL;
  if (!env) return "https://www.thinkats.com";
  try {
    const url = new URL(env);
    return url.origin;
  } catch {
    return `https://${env}`;
  }
}

export async function GET() {
  const baseUrl = getBaseUrl();

  const jobs = (await prisma.job.findMany({
    where: {
      status: "open",
      visibility: "public",
      NOT: {
        internalOnly: true,
      },
    },
    include: {
      tenant: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  })) as any[];

  const payload = {
    provider: "ThinkATS",
    generatedAt: new Date().toISOString(),
    total: jobs.length,
    jobs: jobs.map((job) => {
      const path = job.slug
        ? `/jobs/${encodeURIComponent(job.slug)}`
        : `/jobs/${job.id}`;
      const url = `${baseUrl}${path}`;

      const posted =
        job.createdAt instanceof Date
          ? job.createdAt.toISOString()
          : new Date(job.createdAt).toISOString();

      const updated =
        job.updatedAt instanceof Date
          ? job.updatedAt.toISOString()
          : job.updatedAt
          ? new Date(job.updatedAt).toISOString()
          : null;

      const shortDescription =
        job.shortDescription || job.overview || null;

      const workMode =
        job.workMode || job.locationType || null;

      return {
        id: job.id,
        slug: job.slug,
        title: job.title,
        company: job.tenant?.name ?? null,
        tenantSlug: job.tenant?.slug ?? null,
        status: job.status,
        visibility: job.visibility,
        location: job.location,
        workMode,
        employmentType: job.employmentType,
        department: job.department ?? null,
        url,
        postedAt: posted,
        updatedAt: updated,
        shortDescription,
      };
    }),
  };

  return NextResponse.json(payload);
}
