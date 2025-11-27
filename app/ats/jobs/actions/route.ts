// app/ats/jobs/actions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getResourcinTenant } from "@/lib/tenant";

export async function POST(request: NextRequest) {
  const formData = await request.formData();

  const bulkActionRaw = formData.get("bulkAction");
  const singleActionRaw = formData.get("singleAction");
  const tenantIdRaw = formData.get("tenantId");
  const qRaw = formData.get("q");
  const statusRaw = formData.get("status");

  let jobIds = formData.getAll("jobIds").map((v) => v.toString());

  const bulkAction =
    typeof bulkActionRaw === "string" ? bulkActionRaw : "";
  const singleAction =
    typeof singleActionRaw === "string" ? singleActionRaw : "";
  const tenantId =
    typeof tenantIdRaw === "string" ? tenantIdRaw : undefined;
  const q = typeof qRaw === "string" ? qRaw : "";
  const status =
    typeof statusRaw === "string" ? statusRaw : "";

  // Work out which action to run and which IDs it applies to
  let actionName: string | null = null;

  if (singleAction) {
    const [name, id] = singleAction.split(":");
    actionName = name || null;
    if (id) {
      jobIds = [id];
    }
  } else if (bulkAction) {
    actionName = bulkAction;
  }

  // If nothing to do, just bounce back to /ats/jobs with context
  if (!actionName || jobIds.length === 0) {
    const redirectUrl = buildRedirectUrl(request.url, {
      tenantId,
      q,
      status,
    });
    return NextResponse.redirect(redirectUrl);
  }

  const resolvedTenantId =
    tenantId ||
    (await getResourcinTenant()
      .then((t) => t?.id)
      .catch(() => undefined));

  const where: any = {
    id: { in: jobIds },
  };

  if (resolvedTenantId) {
    where.tenantId = resolvedTenantId;
  }

  switch (actionName) {
    case "publish":
      // Treat "published" as: visibility=public + status=open
      await prisma.job.updateMany({
        where,
        data: {
          visibility: "public",
          status: "open",
        },
      });
      break;

    case "unpublish":
      await prisma.job.updateMany({
        where,
        data: {
          visibility: "internal",
        },
      });
      break;

    case "close":
      await prisma.job.updateMany({
        where,
        data: {
          status: "closed",
        },
      });
      break;

    case "delete":
      await prisma.job.deleteMany({
        where,
      });
      break;

    case "duplicate":
    default:
      // You can implement real duplication later
      break;
  }

  const redirectUrl = buildRedirectUrl(request.url, {
    tenantId,
    q,
    status,
  });

  return NextResponse.redirect(redirectUrl);
}

function buildRedirectUrl(
  requestUrl: string,
  opts: { tenantId?: string; q?: string; status?: string },
) {
  const { tenantId, q, status } = opts;
  const url = new URL(requestUrl);
  url.pathname = "/ats/jobs";

  if (tenantId) url.searchParams.set("tenantId", tenantId);
  if (q) url.searchParams.set("q", q);
  if (status && status !== "all") {
    url.searchParams.set("status", status);
  }

  return url;
}
