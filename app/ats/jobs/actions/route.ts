// app/ats/jobs/actions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getResourcinTenant } from "@/lib/tenant";

type SimpleAction = "publish" | "unpublish" | "close" | "duplicate";

export async function POST(req: NextRequest) {
  const formData = await req.formData();

  const tenantIdFromForm = formData.get("tenantId")?.toString() || "";
  const q = formData.get("q")?.toString() || "";
  const status = formData.get("status")?.toString() || "";

  // Resolve tenant (prefer the one from the form, fall back to default)
  let tenantId = tenantIdFromForm;
  if (!tenantId) {
    const tenant = await getResourcinTenant();
    if (!tenant) {
      return redirectToJobs(req);
    }
    tenantId = tenant.id;
  }

  const singleActionRaw = formData.get("singleAction")?.toString() || "";
  const bulkAction = (formData.get("bulkAction")?.toString() ||
    "") as SimpleAction | "";

  const jobIds = formData.getAll("jobIds").map((v) => v.toString());

  if (singleActionRaw) {
    // singleAction looks like "publish:jobId"
    const [action, id] = singleActionRaw.split(":");
    if (id) {
      await applyAction(action as SimpleAction, tenantId, [id]);
    }
  } else if (bulkAction && jobIds.length > 0) {
    await applyAction(bulkAction, tenantId, jobIds);
  }

  // Redirect back to /ats/jobs, preserving filters
  const url = new URL(req.url);
  const redirectUrl = new URL("/ats/jobs", url.origin);
  redirectUrl.searchParams.set("tenantId", tenantId);
  if (q) redirectUrl.searchParams.set("q", q);
  if (status) redirectUrl.searchParams.set("status", status);

  return NextResponse.redirect(redirectUrl);
}

async function applyAction(
  action: SimpleAction,
  tenantId: string,
  jobIds: string[],
) {
  if (!action || jobIds.length === 0) return;

  if (action === "publish") {
    await prisma.job.updateMany({
      where: {
        id: { in: jobIds },
        tenantId,
      },
      data: {
        isPublished: true,
        visibility: "public",
        status: "open",
      },
    });
    return;
  }

  if (action === "unpublish") {
    await prisma.job.updateMany({
      where: {
        id: { in: jobIds },
        tenantId,
      },
      data: {
        isPublished: false,
        visibility: "internal",
      },
    });
    return;
  }

  if (action === "close") {
    await prisma.job.updateMany({
      where: {
        id: { in: jobIds },
        tenantId,
      },
      data: {
        status: "closed",
        isPublished: false,
      },
    });
    return;
  }

  if (action === "duplicate") {
    // Lightweight duplicate: copy fields and make a draft copy.
    // Using "any" here so we don't fight prisma types for every column.
    const jobs = (await prisma.job.findMany({
      where: {
        id: { in: jobIds },
        tenantId,
      },
    })) as any[];

    for (const job of jobs) {
      const {
        id,
        createdAt,
        updatedAt,
        slug,
        status,
        isPublished,
        ...rest
      } = job;

      await prisma.job.create({
        data: {
          ...(rest as any),
          title: `${job.title} (copy)`,
          slug: slug ? `${slug}-copy-${Date.now()}` : undefined,
          status: "draft",
          isPublished: false,
        } as any,
      });
    }
  }
}

function redirectToJobs(req: NextRequest) {
  const url = new URL(req.url);
  const redirectUrl = new URL("/ats/jobs", url.origin);
  return NextResponse.redirect(redirectUrl);
}
