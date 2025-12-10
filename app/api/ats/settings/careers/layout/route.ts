// app/api/ats/settings/careers/layout/route.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerUser } from "@/lib/auth/getServerUser";
import { parseCareerLayout } from "@/lib/careersLayoutSchema";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const tenantId = req.nextUrl.searchParams.get("tenantId");
  if (!tenantId) {
    return NextResponse.json({ error: "no-tenant" }, { status: 400 });
  }

  const page = await prisma.careerPage.findFirst({
    where: { tenantId, slug: "careers-home" },
  });

  return NextResponse.json({
    ok: true,
    layout: page?.layout ?? null,
  });
}

export async function POST(req: NextRequest) {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const body = await req.json().catch(() => null) as any;

  const tenantId =
    typeof body?.tenantId === "string" && body.tenantId.trim().length > 0
      ? body.tenantId.trim()
      : null;

  if (!tenantId) {
    return NextResponse.json({ error: "no-tenant" }, { status: 400 });
  }

  // Support both: { tenantId, layout: {...} } and { sections: [...] }
  const rawLayout = body?.layout ?? body;

  let layout;
  try {
    layout = parseCareerLayout(rawLayout);
  } catch (err: any) {
    return NextResponse.json(
      {
        error: "invalid-layout",
        details: err?.issues ?? err?.message ?? "Invalid layout payload",
      },
      { status: 400 },
    );
  }

  await prisma.careerPage.upsert({
    where: {
      tenantId_slug: {
        tenantId,
        slug: "careers-home",
      },
    },
    create: {
      tenantId,
      slug: "careers-home",
      layout,
    },
    update: {
      layout,
    },
  });

  return NextResponse.json({ ok: true });
}
