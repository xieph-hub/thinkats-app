// app/api/ats/views/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getResourcinTenant } from "@/lib/tenant";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const tenant = await getResourcinTenant();
    if (!tenant) {
      return NextResponse.json(
        { ok: false, error: "No tenant configured" },
        { status: 400 },
      );
    }

    const formData = await req.formData();

    const scopeRaw = formData.get("scope");
    const nameRaw = formData.get("name");
    const redirectToRaw = formData.get("redirectTo");

    const scope =
      typeof scopeRaw === "string" ? scopeRaw.trim() : "";
    const name =
      typeof nameRaw === "string" ? nameRaw.trim() : "";

    if (!scope || !name) {
      return NextResponse.json(
        { ok: false, error: "Scope and name are required" },
        { status: 400 },
      );
    }

    // Generic filters (we only store what is passed in)
    const q = formData.get("q");
    const stage = formData.get("stage");
    const status = formData.get("status");
    const tier = formData.get("tier");
    const source = formData.get("source");
    const jobId = formData.get("jobId");

    const params: any = {};
    if (typeof q === "string" && q.trim()) params.q = q.trim();
    if (typeof stage === "string" && stage.trim())
      params.stage = stage.trim();
    if (typeof status === "string" && status.trim())
      params.status = status.trim();
    if (typeof tier === "string" && tier.trim())
      params.tier = tier.trim();
    if (typeof source === "string" && source.trim())
      params.source = source.trim();
    if (typeof jobId === "string" && jobId.trim())
      params.jobId = jobId.trim();

    const setDefaultRaw = formData.get("setDefault");
    const isDefault =
      typeof setDefaultRaw === "string"
        ? setDefaultRaw === "true" ||
          setDefaultRaw === "on" ||
          setDefaultRaw === "1"
        : false;

    await prisma.savedView.create({
      data: {
        tenantId: tenant.id,
        scope,
        name,
        params,
        isDefault,
      },
    });

    const redirectTo =
      typeof redirectToRaw === "string" && redirectToRaw.trim()
        ? redirectToRaw.trim()
        : "/ats";

    const redirectUrl = new URL(redirectTo, req.url);
    return NextResponse.redirect(redirectUrl, { status: 303 });
  } catch (err) {
    console.error("Create saved view error:", err);
    return NextResponse.json(
      { ok: false, error: "Unexpected error creating saved view" },
      { status: 500 },
    );
  }
}
