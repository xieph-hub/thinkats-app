// app/api/ats/settings/scoring/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getResourcinTenant } from "@/lib/tenant";
import {
  mergeScoringConfig,
  type HiringMode,
  type ScoringConfig,
} from "@/lib/scoring/config";

type UpdatePayload = {
  hiringMode?: HiringMode;
  config?: Partial<ScoringConfig>;
};

export async function GET(_req: Request) {
  try {
    const tenant = await getResourcinTenant();
    if (!tenant) {
      return NextResponse.json(
        { ok: false, error: "No default tenant configured" },
        { status: 400 },
      );
    }

    const freshTenant = await prisma.tenant.findUnique({
      where: { id: tenant.id },
      select: {
        id: true,
        plan: true,
        hiringMode: true,
        scoringConfig: true,
      },
    });

    if (!freshTenant) {
      return NextResponse.json(
        { ok: false, error: "Tenant not found" },
        { status: 404 },
      );
    }

    const merged = mergeScoringConfig({
      mode: freshTenant.hiringMode,
      plan: freshTenant.plan,
      tenantConfig: freshTenant.scoringConfig,
    });

    return NextResponse.json({
      ok: true,
      tenantId: freshTenant.id,
      plan: merged.plan,
      hiringMode: merged.mode,
      config: merged,
    });
  } catch (err) {
    console.error("GET /api/ats/settings/scoring error:", err);
    return NextResponse.json(
      { ok: false, error: "Failed to load scoring settings" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const tenant = await getResourcinTenant();
    if (!tenant) {
      return NextResponse.json(
        { ok: false, error: "No default tenant configured" },
        { status: 400 },
      );
    }

    const body = (await req.json()) as UpdatePayload;

    const hiringMode = body.hiringMode || undefined;
    const config = body.config || undefined;

    const updated = await prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        ...(hiringMode ? { hiringMode } : {}),
        ...(config ? { scoringConfig: config as any } : {}),
      },
      select: {
        id: true,
        plan: true,
        hiringMode: true,
        scoringConfig: true,
      },
    });

    const merged = mergeScoringConfig({
      mode: updated.hiringMode,
      plan: updated.plan,
      tenantConfig: updated.scoringConfig,
    });

    return NextResponse.json({
      ok: true,
      tenantId: updated.id,
      plan: merged.plan,
      hiringMode: merged.mode,
      config: merged,
    });
  } catch (err) {
    console.error("POST /api/ats/settings/scoring error:", err);
    return NextResponse.json(
      { ok: false, error: "Failed to update scoring settings" },
      { status: 500 },
    );
  }
}
