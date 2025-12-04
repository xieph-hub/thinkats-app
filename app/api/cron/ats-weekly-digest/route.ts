// app/api/cron/ats-weekly-digest/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resend } from "@/lib/resendClient";
import AtsWeeklyDigestEmail from "@/emails/AtsWeeklyDigestEmail";

const RESEND_FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL || "ThinkATS <no-reply@mail.thinkats.com>";
const SUPERADMIN_DIGEST_EMAIL =
  process.env.SUPERADMIN_DIGEST_EMAIL || process.env.ATS_NOTIFICATIONS_EMAIL || "";

export const dynamic = "force-dynamic";

export async function GET() {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // 1) Load all tenants
  const tenants = await prisma.tenant.findMany();

  const tenantDigests: any[] = [];
  const sendPromises: Promise<unknown>[] = [];

  for (const tenant of tenants) {
    const tenantId = tenant.id;

    // Jobs created in last 7 days
    const jobs = await prisma.job.findMany({
      where: {
        tenantId,
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
      include: {
        _count: {
          select: { applications: true },
        },
      },
    });

    // Applications in last 7 days
    const applications = await prisma.jobApplication.findMany({
      where: {
        job: { tenantId },
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
      include: {
        job: true,
      },
    });

    if (jobs.length === 0 && applications.length === 0) {
      continue; // skip inactive tenants for this digest
    }

    const hires = applications.filter(
      (app) => (app.status || "").toUpperCase() === "HIRED",
    ).length;

    const rejections = applications.filter((app) =>
      ["REJECTED", "ARCHIVED"].includes((app.status || "").toUpperCase()),
    ).length;

    // Top 3 jobs by applications in this window
    const appsByJob = new Map<string, { jobTitle: string; count: number }>();
    for (const app of applications) {
      const jobId = app.jobId;
      const jobTitle = app.job?.title || "Untitled role";
      const existing = appsByJob.get(jobId) || {
        jobTitle,
        count: 0,
      };
      existing.count += 1;
      appsByJob.set(jobId, existing);
    }
    const topJobs = Array.from(appsByJob.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 3)
      .map(([jobId, info]) => ({
        jobId,
        title: info.jobTitle,
        applications: info.count,
      }));

    const digestPayload = {
      tenantId,
      tenantName: tenant.name,
      fromDate: sevenDaysAgo,
      toDate: now,
      newJobsCount: jobs.length,
      newApplicationsCount: applications.length,
      hiresCount: hires,
      rejectionsCount: rejections,
      topJobs,
    };

    tenantDigests.push(digestPayload);

    const tenantEmail =
      (tenant as any).notificationEmail ||
      (tenant as any).ownerEmail ||
      SUPERADMIN_DIGEST_EMAIL;

    if (tenantEmail) {
      sendPromises.push(
        resend.emails.send({
          from: RESEND_FROM_EMAIL,
          to: tenantEmail,
          subject: `Weekly ATS digest – ${tenant.name || tenant.id}`,
          react: AtsWeeklyDigestEmail({ digest: digestPayload }),
        }),
      );
    }
  }

  // Superadmin global digest
  if (SUPERADMIN_DIGEST_EMAIL && tenantDigests.length > 0) {
    sendPromises.push(
      resend.emails.send({
        from: RESEND_FROM_EMAIL,
        to: SUPERADMIN_DIGEST_EMAIL,
        subject: "Weekly ATS digest – global overview",
        react: AtsWeeklyDigestEmail({
          digest: {
            scope: "GLOBAL",
            tenants: tenantDigests,
          },
        }),
      }),
    );
  }

  await Promise.allSettled(sendPromises);

  return NextResponse.json({
    ok: true,
    tenantsProcessed: tenantDigests.length,
  });
}
