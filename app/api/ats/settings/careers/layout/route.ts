// app/api/ats/settings/careers/layout/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerUser } from "@/lib/auth/getServerUser";
import { parseCareerLayout } from "@/lib/careersLayoutSchema";
import { getCurrentTenantId } from "@/lib/tenantContext"; // whatever you use

export async function GET() {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const tenantId = await getCurrentTenantId(user);
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

export async function POST(req: Request) {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const tenantId = await getCurrentTenantId(user);
  if (!tenantId) {
    return NextResponse.json({ error: "no-tenant" }, { status: 400 });
  }

  const body = await req.json();

  let layout;
  try {
    layout = parseCareerLayout(body);
  } catch (err: any) {
    return NextResponse.json(
      { error: "invalid-layout", details: err?.issues ?? err?.message },
      { status: 400 },
    );
  }

  await prisma.careerPage.upsert({
    where: {
      // adjust to your unique constraint
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
