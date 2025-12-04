// app/api/digests/weekly/route.ts
import * as React from "react";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resend } from "@/lib/resendClient";
import WeeklyApplicationsDigest, {
  WeeklyApplicationsDigestProps,
} from "@/emails/WeeklyApplicationsDigest";

const PUBLIC_SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.thinkats.com";

const RESEND_FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL || "ThinkATS <no-reply@mail.thinkats.com>";

// Global super-admin digest recipient
const ATS_NOTIFICATIONS_EMAIL =
  process.env.ATS_NOTIFICATIONS_EMAIL ||
  process.env.RESOURCIN_ADMIN_EMAIL ||
  "";

export const dynamic = "force-dynamic";

function formatDateForEmail(date: Date) {
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Helper to add one application into a jobMap structure
function addApplicationToJobMap(
  jobMap: Map<string, WeeklyApplicationsDigestProps["jobGroups"][0]>,
  job: any,
  app: any,
) {
  const tenant = job.tenant;
  const client = job.clientCompany;

  const canonicalPath = job.slug
    ? `/jobs/${encodeURIComponent(job.slug)}`
    : `/jobs/${encodeURIComponent(job.id)}`;
  const jobPublicUrl = `${PUBLIC_SITE_URL}${canonicalPath}`;
  const atsJobUrl = `${PUBLIC_SITE_URL}/ats/jobs/${job.id}`;

  const jobKey = job.id;

  if (!jobMap.has(jobKey)) {
    jobMap.set(jobKey, {
      jobTitle: job.title,
      jobLocation: job.location,
      tenantName: tenant?.name || tenant?.slug || null,
      clientName: client?.name || null,
      jobPublicUrl,
      atsJobUrl,
      applications: [],
    });
  }

  const group = jobMap.get(jobKey)!;
  group.applications.push({
    candidateName: app.fullName,
    candidateEmail: app.email,
    location: app.location,
    source: app.source,
    createdAt: formatDateForEmail(app.createdAt),
  });
}

export async function GET(_req: Request) {
  try {
    const now = new Date();
    const since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // last 7 days

    const applications = await prisma.jobApplication.findMany({
      where: {
        createdAt: { gte: since },
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        job: {
          include: {
            tenant: {
              select: {
                id: true,
                name: true,
                slug: true,
                primaryContactEmail: true,
              },
            },
            clientCompany: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    // Guard against orphaned records
    const validApps = applications.filter((app) => app.job && app.job.tenant);

    if (validApps.length === 0) {
      return NextResponse.json({
        ok: true,
        message: "No applications in the last 7 days – no digests sent.",
      });
    }

    const periodLabel = `${since.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })} – ${now.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })}`;

    // ----------------------------------------------------------
    // 1) PER-TENANT DIGESTS (each tenant gets their own email)
    // ----------------------------------------------------------
    type TenantBucket = {
      tenantId: string;
      tenantName: string | null;
      tenantEmail: string | null;
      jobMap: Map<string, WeeklyApplicationsDigestProps["jobGroups"][0]>;
    };

    const tenantBuckets = new Map<string, TenantBucket>();

    for (const app of validApps) {
      const job = app.job as any;
      const tenant = job.tenant as any;
      const tenantId = tenant.id as string;

      let bucket = tenantBuckets.get(tenantId);
      if (!bucket) {
        bucket = {
          tenantId,
          tenantName: tenant.name || tenant.slug || null,
          tenantEmail: tenant.primaryContactEmail || null,
          jobMap: new Map(),
        };
        tenantBuckets.set(tenantId, bucket);
      }

      addApplicationToJobMap(bucket.jobMap, job, app);
    }

    const perTenantResults: Array<{
      tenantId: string;
      tenantName: string | null;
      sent: boolean;
      totalApplications: number;
    }> = [];

    for (const bucket of tenantBuckets.values()) {
      const jobGroups = Array.from(bucket.jobMap.values()).sort((a, b) =>
        a.jobTitle.localeCompare(b.jobTitle),
      );
      const totalApplications = jobGroups.reduce(
        (sum, j) => sum + j.applications.length,
        0,
      );

      // If no email configured for this tenant, skip sending
      if (!bucket.tenantEmail || totalApplications === 0) {
        perTenantResults.push({
          tenantId: bucket.tenantId,
          tenantName: bucket.tenantName,
          sent: false,
          totalApplications,
        });
        continue;
      }

      const props: WeeklyApplicationsDigestProps = {
        periodLabel,
        totalApplications,
        jobGroups,
      };

      await resend.emails.send({
        from: RESEND_FROM_EMAIL,
        to: bucket.tenantEmail,
        subject: `Weekly applications – ${periodLabel} (${totalApplications})`,
        react: WeeklyApplicationsDigest(props),
      });

      perTenantResults.push({
        tenantId: bucket.tenantId,
        tenantName: bucket.tenantName,
        sent: true,
        totalApplications,
      });
    }

    // ----------------------------------------------------------
    // 2) GLOBAL SUPER-ADMIN DIGEST (all tenants combined)
    // ----------------------------------------------------------
    let globalResult: { sent: boolean; totalApplications: number } = {
      sent: false,
      totalApplications: 0,
    };

    if (ATS_NOTIFICATIONS_EMAIL) {
      const globalJobMap = new Map<
        string,
        WeeklyApplicationsDigestProps["jobGroups"][0]
      >();

      for (const app of validApps) {
        addApplicationToJobMap(globalJobMap, app.job, app);
      }

      const globalJobGroups = Array.from(globalJobMap.values()).sort((a, b) =>
        a.jobTitle.localeCompare(b.jobTitle),
      );
      const totalApplications = globalJobGroups.reduce(
        (sum, j) => sum + j.applications.length,
        0,
      );

      if (totalApplications > 0) {
        const props: WeeklyApplicationsDigestProps = {
          periodLabel,
          totalApplications,
          jobGroups: globalJobGroups,
        };

        await resend.emails.send({
          from: RESEND_FROM_EMAIL,
          to: ATS_NOTIFICATIONS_EMAIL,
          subject: `Weekly applications – global view ${periodLabel} (${totalApplications})`,
          react: WeeklyApplicationsDigest(props),
        });

        globalResult = { sent: true, totalApplications };
      }
    }

    return NextResponse.json({
      ok: true,
      totalApplications: validApps.length,
      tenantsProcessed: perTenantResults.length,
      perTenantResults,
      globalResult,
    });
  } catch (err) {
    console.error("[WEEKLY DIGEST] Error:", err);
    return NextResponse.json(
      { ok: false, error: "Failed to generate weekly digests." },
      { status: 500 },
    );
  }
}
