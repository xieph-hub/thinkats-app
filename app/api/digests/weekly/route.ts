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

export async function GET(req: Request) {
  try {
    if (!ATS_NOTIFICATIONS_EMAIL) {
      console.warn(
        "[WEEKLY DIGEST] ATS_NOTIFICATIONS_EMAIL / RESOURCIN_ADMIN_EMAIL not set – skipping.",
      );
      return NextResponse.json(
        {
          ok: false,
          error: "No internal notifications email configured.",
        },
        { status: 500 },
      );
    }

    const now = new Date();
    const since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // last 7 days

    const applications = await prisma.jobApplication.findMany({
      where: {
        createdAt: {
          gte: since,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        job: {
          include: {
            tenant: true,
            clientCompany: true,
          },
        },
      },
    });

    // Filter out orphaned applications just in case
    const validApps = applications.filter((app) => app.job);

    if (validApps.length === 0) {
      return NextResponse.json({
        ok: true,
        message: "No applications in the last 7 days – no digest sent.",
      });
    }

    // Group by job
    const jobMap = new Map<string, WeeklyApplicationsDigestProps["jobGroups"][0]>();

    for (const app of validApps) {
      const job = app.job!;
      const tenant = job.tenant;
      const client = job.clientCompany;

      const jobKey = job.id;

      if (!jobMap.has(jobKey)) {
        const canonicalPath = job.slug
          ? `/jobs/${encodeURIComponent(job.slug)}`
          : `/jobs/${encodeURIComponent(job.id)}`;
        const jobPublicUrl = `${PUBLIC_SITE_URL}${canonicalPath}`;
        const atsJobUrl = `${PUBLIC_SITE_URL}/ats/jobs/${job.id}`;

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

    const jobGroups = Array.from(jobMap.values()).sort((a, b) =>
      a.jobTitle.localeCompare(b.jobTitle),
    );

    const totalApplications = validApps.length;

    const periodLabel = `${since.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })} – ${now.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })}`;

    const emailProps: WeeklyApplicationsDigestProps = {
      periodLabel,
      totalApplications,
      jobGroups,
    };

    await resend.emails.send({
      from: RESEND_FROM_EMAIL,
      to: ATS_NOTIFICATIONS_EMAIL,
      subject: `Weekly applications digest – ${periodLabel} (${totalApplications})`,
      react: WeeklyApplicationsDigest(emailProps),
    });

    return NextResponse.json({
      ok: true,
      sentTo: ATS_NOTIFICATIONS_EMAIL,
      totalApplications,
      jobs: jobGroups.length,
    });
  } catch (err) {
    console.error("[WEEKLY DIGEST] Error:", err);
    return NextResponse.json(
      { ok: false, error: "Failed to generate weekly digest." },
      { status: 500 },
    );
  }
}
