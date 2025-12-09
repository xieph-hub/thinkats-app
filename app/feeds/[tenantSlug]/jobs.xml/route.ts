// app/feeds/[tenantSlug]/jobs.xml/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type RouteParams = {
  params: { tenantSlug: string };
};

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

function escapeXml(value: string | null | undefined): string {
  if (!value) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET(_req: Request, { params }: RouteParams) {
  const { tenantSlug } = params;
  const baseUrl = getBaseUrl();

  const tenant = await prisma.tenant.findUnique({
    where: { slug: tenantSlug },
  });

  if (!tenant) {
    const emptyXml = `<?xml version="1.0" encoding="UTF-8"?>
<jobs provider="ThinkATS" tenantSlug="${escapeXml(
      tenantSlug,
    )}" generatedAt="${escapeXml(new Date().toISOString())}">
</jobs>`;
    return new NextResponse(emptyXml, {
      status: 200,
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
      },
    });
  }

  const jobs = (await prisma.job.findMany({
    where: {
      tenantId: tenant.id,
      status: "open",
      visibility: "public",
      NOT: {
        internalOnly: true,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  })) as any[];

  const items = jobs
    .map((job) => {
      const path = job.slug
        ? `/jobs/${encodeURIComponent(job.slug)}`
        : `/jobs/${job.id}`;
      const url = `${baseUrl}${path}`;

      const posted =
        job.createdAt instanceof Date
          ? job.createdAt.toISOString()
          : new Date(job.createdAt).toISOString();

      const description =
        job.shortDescription || job.overview || job.description || "";

      return `
  <job>
    <id>${escapeXml(job.id)}</id>
    <title>${escapeXml(job.title)}</title>
    <company>${escapeXml(tenant.name || "")}</company>
    <tenantSlug>${escapeXml(tenantSlug)}</tenantSlug>
    <location>${escapeXml(job.location)}</location>
    <workMode>${escapeXml(job.workMode || job.locationType)}</workMode>
    <employmentType>${escapeXml(job.employmentType)}</employmentType>
    <department>${escapeXml(job.department)}</department>
    <url>${escapeXml(url)}</url>
    <status>${escapeXml(job.status)}</status>
    <postedAt>${escapeXml(posted)}</postedAt>
    <description><![CDATA[${description}]]></description>
  </job>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<jobs provider="ThinkATS" tenantSlug="${escapeXml(
    tenantSlug,
  )}" generatedAt="${escapeXml(new Date().toISOString())}">
${items}
</jobs>`;

  return new NextResponse(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
}
