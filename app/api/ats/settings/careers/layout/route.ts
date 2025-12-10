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

  // Prefer the composite unique if present, otherwise this still works fine.
  const page = await prisma.careerPage.findUnique({
    where: {
      tenantId_slug: {
        tenantId,
        slug: "careers-home",
      },
    },
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

  const body = (await req.json().catch(() => null)) as unknown;

  // Make tenantId explicitly string | null so Prisma is happy
  let tenantId: string | null = null;
  if (
    body &&
    typeof (body as any).tenantId === "string" &&
    (body as any).tenantId.trim().length > 0
  ) {
    tenantId = (body as any).tenantId.trim();
  }

  if (!tenantId) {
    return NextResponse.json({ error: "no-tenant" }, { status: 400 });
  }

  // Support both: { tenantId, layout: {...} } and { sections: [...] }
  const rawLayout = (body as any)?.layout ?? body;

  let layout: any;
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
      // Required by your Prisma schema (CareerPage.path is non-nullable)
      path: "/careers",
      // kind has a default of CAREERS_HOME in the DB, so we can omit it
      layout,
    },
    update: {
      layout,
    },
  });

  return NextResponse.json({ ok: true });
}
