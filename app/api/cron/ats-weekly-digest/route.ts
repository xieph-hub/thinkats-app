// app/api/cron/ats-weekly-digest/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resend } from "@/lib/resendClient";
import AtsWeeklyDigestEmail from "@/emails/AtsWeeklyDigestEmail";

const RESEND_FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL ||
  "ThinkATS <no-reply@mail.resourcin.com>";

const PUBLIC_SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.resourcin.com";

function getWeekWindow() {
  const now = new Date();
  const end = now;
  const start = new Date(now);
  start.setDate(now.getDate() - 7);

  const rangeLabel = `${start.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
  })} – ${end.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })}`;

  return { start, end, rangeLabel };
}

export async function GET(_req: NextRequest) {
  try {
    const { start, end, rangeLabel } = getWeekWindow();

    const tenants = await prisma.tenant.findMany();

    const results: Array<{
      tenantId: string;
      tenantName: string;
      sent: boolean;
      reason?: string;
    }> = [];

    for (const tenant of tenants) {
      const tenantName = tenant.name;
      const notificationEmail =
        (tenant as any).notificationEmail ||
        (tenant as any).primaryContactEmail;

      if (!notificationEmail) {
        results.push({
          tenantId: tenant.id,
          tenantName,
          sent: false,
          reason: "No notification email configured",
        });
        continue;
      }

      // Open jobs (simple lower/upper case support)
      const openJobsCount = await prisma.job.count({
        where: {
          tenantId: tenant.id,
          status: { in: ["open", "OPEN"] },
        },
      });

      // New applications in window
      const newApplicationsCount = await prisma.jobApplication.count({
        where: {
          job: {
            tenantId: tenant.id,
          },
          createdAt: {
            gte: start,
            lte: end,
          },
        },
      });

      // New candidates in window
      const newCandidatesCount = await prisma.candidate.count({
        where: {
          tenantId: tenant.id,
          createdAt: {
            gte: start,
            lte: end,
          },
        },
      });

      // Per-job breakdown
      const jobsWithApps = await prisma.job.findMany({
        where: {
          tenantId: tenant.id,
        },
        select: {
          id: true,
          title: true,
          applications: {
            where: {
              createdAt: {
                gte: start,
                lte: end,
              },
            },
            select: {
              id: true,
            },
          },
        },
      });

      const perJobStats = jobsWithApps
        .map((job) => ({
          jobId: job.id,
          jobTitle: job.title || "Untitled role",
          newApplications: job.applications.length,
        }))
        .filter((j) => j.newApplications > 0)
        .sort((a, b) => b.newApplications - a.newApplications);

      // If absolutely nothing happened, skip sending noise
      if (
        newApplicationsCount === 0 &&
        newCandidatesCount === 0 &&
        openJobsCount === 0
      ) {
        results.push({
          tenantId: tenant.id,
          tenantName,
          sent: false,
          reason: "No activity in the last 7 days",
        });
        continue;
      }

      await resend.emails.send({
        from: RESEND_FROM_EMAIL,
        to: notificationEmail,
        subject: `ThinkATS weekly digest – ${rangeLabel}`,
        react: AtsWeeklyDigestEmail({
          tenantName,
          weekRangeLabel: rangeLabel,
          totalNewApplications: newApplicationsCount,
          totalNewCandidates: newCandidatesCount,
          totalOpenJobs: openJobsCount,
          perJobStats,
          dashboardUrl: `${PUBLIC_SITE_URL}/ats/dashboard`,
        }),
      });

      results.push({
        tenantId: tenant.id,
        tenantName,
        sent: true,
      });
    }

    return NextResponse.json({
      ok: true,
      window: {
        start: start.toISOString(),
        end: end.toISOString(),
        label: rangeLabel,
      },
      results,
    });
  } catch (error) {
    console.error("Error sending ATS weekly digests:", error);
    return NextResponse.json(
      {
        ok: false,
        error:
          "Something went wrong while generating ATS weekly digests.",
      },
      { status: 500 },
    );
  }
}
