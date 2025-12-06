// app/api/ats/jobs/[jobId]/pipeline/export/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getResourcinTenant } from "@/lib/tenant";

function toCsvValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (s.includes('"') || s.includes(",") || s.includes("\n")) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

function toCsvRow(values: (string | number | null | undefined)[]): string {
  return values.map(toCsvValue).join(",");
}

function getSourceLabel(app: any): string | null {
  const sourceTag = app.candidate?.tags
    ?.map((ct: any) => ct.tag)
    .find((t: any) => t.kind === "SOURCE");

  if (sourceTag) return sourceTag.name;
  if (app.source) return app.source;
  if (app.howHeard) return app.howHeard;
  return null;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { jobId: string } },
) {
  try {
    const tenant = await getResourcinTenant();

    if (!tenant) {
      return NextResponse.json(
        { error: "No default tenant configured." },
        { status: 500 },
      );
    }

    const jobId = params.jobId;
    if (!jobId) {
      return NextResponse.json(
        { error: "Missing jobId." },
        { status: 400 },
      );
    }

    const url = new URL(req.url);
    const formatParam = (url.searchParams.get("format") || "csv").toLowerCase();
    const format = formatParam === "xls" ? "xls" : "csv";

    const job = await prisma.job.findFirst({
      where: {
        id: jobId,
        tenantId: tenant.id,
      },
      include: {
        applications: {
          orderBy: { createdAt: "desc" },
          include: {
            candidate: {
              include: {
                skills: {
                  include: { skill: true },
                  orderBy: { createdAt: "desc" },
                },
                tags: {
                  include: { tag: true },
                },
              },
            },
            scoringEvents: {
              orderBy: { createdAt: "desc" },
              take: 1,
            },
          },
        },
      },
    });

    if (!job) {
      return NextResponse.json(
        { error: "Job not found." },
        { status: 404 },
      );
    }

    const headersRow = toCsvRow([
      "job_id",
      "job_title",
      "job_slug",
      "stage",
      "status",
      "application_id",
      "candidate_id",
      "candidate_name",
      "candidate_email",
      "candidate_phone",
      "candidate_location",
      "candidate_current_title",
      "candidate_current_company",
      "score",
      "tier",
      "scoring_reason",
      "source",
      "candidate_skills",
      "job_required_skills",
      "created_at",
    ]);

    const rows: string[] = [headersRow];

    const requiredSkills = (job.requiredSkills ?? []) as string[];

    for (const app of job.applications) {
      const candidate = app.candidate;
      const latestScoring = app.scoringEvents[0] ?? null;

      const score =
        typeof app.matchScore === "number"
          ? app.matchScore
          : latestScoring?.score ?? null;

      const tier = latestScoring?.tier ?? null;
      const scoreReason =
        latestScoring?.reason ??
        app.matchReason ??
        "Scored by semantic CV/JD engine.";

      const sourceLabel = getSourceLabel(app);

      const skills =
        candidate?.skills?.map((cs: any) => cs.skill).filter(Boolean) ?? [];
      const skillNames = skills.map((s: any) => s.name).join(" | ");

      const requiredSkillsStr = requiredSkills.join(" | ");
      const createdAtIso = app.createdAt.toISOString();

      rows.push(
        toCsvRow([
          job.id,
          job.title,
          job.slug ?? "",
          app.stage,
          app.status,
          app.id,
          candidate?.id ?? "",
          candidate?.fullName ?? app.fullName,
          candidate?.email ?? app.email,
          candidate?.phone ?? app.phone ?? "",
          candidate?.location ?? app.location ?? "",
          candidate?.currentTitle ?? "",
          candidate?.currentCompany ?? "",
          score ?? "",
          tier ?? "",
          scoreReason,
          sourceLabel ?? "",
          skillNames,
          requiredSkillsStr,
          createdAtIso,
        ]),
      );
    }

    const csvContent = rows.join("\r\n");
    const bom = "\uFEFF"; // helps Excel open UTF-8 cleanly

    const ext = format === "xls" ? "xls" : "csv";
    const contentType =
      format === "xls"
        ? "application/vnd.ms-excel; charset=utf-8"
        : "text/csv; charset=utf-8";

    const filenameBase = job.slug || `job-${job.id}`;
    const filename = `${filenameBase}-pipeline-${new Date()
      .toISOString()
      .slice(0, 10)}.${ext}`;

    return new NextResponse(bom + csvContent, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error(
      "GET /api/ats/jobs/[jobId]/pipeline/export error",
      err,
    );
    return NextResponse.json(
      { error: "Failed to export pipeline." },
      { status: 500 },
    );
  }
}
