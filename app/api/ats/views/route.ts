// app/api/ats/views/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerUser } from "@/lib/auth/getServerUser";
import { cookies } from "next/headers";
import { OTP_COOKIE_NAME } from "@/lib/requireOtp";

export const runtime = "nodejs";

type ParsedBody = {
  // common
  id?: string | null;
  scope?: string | null;
  name?: string | null;
  sort?: any;

  // compatibility (older clients)
  params?: any;
  filters?: any;

  // sharing/default
  isDefault?: boolean;
  isShared?: boolean;

  // form-based fields you use in the UI
  q?: string | null;
  stage?: string | null;
  status?: string | null;
  tier?: string | null;
  setDefault?: boolean;

  // optional redirect flow for forms
  redirectTo?: string | null;
};

function safeStartsWithAtsPath(path: string | null | undefined) {
  if (!path) return false;
  return path.startsWith("/ats");
}

async function requireAtsAuthOrThrow() {
  const ctx = await getServerUser();
  if (!ctx?.user?.id) return { ok: false as const, ctx: null };

  // OTP gating for ATS APIs (keeps your model consistent)
  const flag = cookies().get(OTP_COOKIE_NAME)?.value;
  const isOtpOk = flag === "1";
  if (!isOtpOk) return { ok: false as const, ctx: null, otp: false as const };

  return { ok: true as const, ctx, otp: true as const };
}

/**
 * Global-standard active tenant resolution:
 * - Today: use the user's primary tenant as "active"
 * - Next: you can upgrade this to a workspace switcher cookie later
 */
function resolveActiveTenantId(ctx: Awaited<ReturnType<typeof getServerUser>>) {
  return ctx?.primaryTenantId ?? null;
}

function buildAllowedTenantIds(ctx: Awaited<ReturnType<typeof getServerUser>>) {
  return (ctx?.tenantRoles ?? []).map((r) => r.tenantId);
}

async function parseBody(req: NextRequest): Promise<{
  body: ParsedBody;
  mode: "json" | "form";
}> {
  const contentType = req.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const json = await req.json().catch(() => ({}));
    return { body: json ?? {}, mode: "json" };
  }

  // FormData (from <form method="POST">)
  const fd = await req.formData().catch(() => null);

  const get = (k: string) => {
    const v = fd?.get(k);
    return typeof v === "string" ? v : null;
  };

  return {
    mode: "form",
    body: {
      id: get("id"),
      scope: get("scope"),
      name: get("name"),
      redirectTo: get("redirectTo"),

      // filters passed via hidden inputs in your page
      q: get("q"),
      stage: get("stage"),
      status: get("status"),
      tier: get("tier"),

      // checkbox
      setDefault: get("setDefault") === "on" || get("setDefault") === "1",
      isShared: get("isShared") === "on" || get("isShared") === "1",
    },
  };
}

function buildFiltersPayload(body: ParsedBody) {
  // JSON callers may send filters/params
  if (body.filters != null) return body.filters;
  if (body.params != null) return body.params;

  // Form callers send q/stage/status/tier
  const payload: Record<string, any> = {};

  if (typeof body.q === "string") payload.q = body.q;
  if (typeof body.stage === "string") payload.stage = body.stage;
  if (typeof body.status === "string") payload.status = body.status;
  if (typeof body.tier === "string") payload.tier = body.tier;

  return payload;
}

// GET /api/ats/views?scope=applications_pipeline&includeShared=1
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAtsAuthOrThrow();

    if (!auth.ok) {
      return NextResponse.json(
        { ok: false, error: auth.otp === false ? "otp_required" : "unauthenticated" },
        { status: 401 },
      );
    }

    const ctx = auth.ctx;

    const activeTenantId = resolveActiveTenantId(ctx);
    if (!activeTenantId) {
      return NextResponse.json({ ok: false, error: "no_active_tenant" }, { status: 400 });
    }

    // tenant membership enforcement (unless super admin)
    const allowedTenantIds = buildAllowedTenantIds(ctx);
    if (!ctx.isSuperAdmin && !allowedTenantIds.includes(activeTenantId)) {
      return NextResponse.json({ ok: false, error: "tenant_forbidden" }, { status: 403 });
    }

    const url = new URL(req.url);
    const scope = url.searchParams.get("scope") || undefined;
    const includeShared = url.searchParams.get("includeShared") === "1";

    const where: any = {
      tenantId: activeTenantId,
    };

    if (scope) where.scope = scope;

    if (includeShared) {
      // My views OR shared views in this tenant
      where.OR = [{ ownerId: ctx.user.id }, { isShared: true }];
    } else {
      // My views only
      where.ownerId = ctx.user.id;
    }

    const views = await prisma.savedView.findMany({
      where,
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ ok: true, views });
  } catch (err) {
    console.error("GET /api/ats/views error:", err);
    return NextResponse.json(
      { ok: false, error: "Unexpected error listing views" },
      { status: 500 },
    );
  }
}

// POST /api/ats/views
// Supports BOTH:
// - JSON: { id?, scope, name, filters?/params?, sort?, isDefault?, isShared? }
// - FormData: fields your page posts (scope, name, q, stage, status, tier, setDefault, redirectTo)
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAtsAuthOrThrow();

    if (!auth.ok) {
      return NextResponse.json(
        { ok: false, error: auth.otp === false ? "otp_required" : "unauthenticated" },
        { status: 401 },
      );
    }

    const ctx = auth.ctx;

    const activeTenantId = resolveActiveTenantId(ctx);
    if (!activeTenantId) {
      return NextResponse.json({ ok: false, error: "no_active_tenant" }, { status: 400 });
    }

    // tenant membership enforcement (unless super admin)
    const allowedTenantIds = buildAllowedTenantIds(ctx);
    if (!ctx.isSuperAdmin && !allowedTenantIds.includes(activeTenantId)) {
      return NextResponse.json({ ok: false, error: "tenant_forbidden" }, { status: 403 });
    }

    const { body, mode } = await parseBody(req);

    const id = (typeof body.id === "string" && body.id.trim()) ? body.id.trim() : null;
    const scope = (typeof body.scope === "string" && body.scope.trim()) ? body.scope.trim() : null;
    const name = (typeof body.name === "string" && body.name.trim()) ? body.name.trim() : null;

    if (!scope || !name) {
      return NextResponse.json(
        { ok: false, error: "Missing required fields: scope, name" },
        { status: 400 },
      );
    }

    const filtersPayload = buildFiltersPayload(body);
    const sharedFlag = Boolean(body.isShared);
    const markDefault = Boolean(body.isDefault) || Boolean(body.setDefault);
    const sort = (body as any).sort ?? null;

    // IMPORTANT: never trust tenantId from body — always use activeTenantId
    let savedView: any = null;

    if (id) {
      // Update: must be in this tenant and owned by user (or super admin)
      const existing = await prisma.savedView.findFirst({
        where: {
          id,
          tenantId: activeTenantId,
        },
        select: { id: true, ownerId: true, scope: true },
      });

      if (!existing) {
        return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
      }

      if (!ctx.isSuperAdmin && existing.ownerId !== ctx.user.id) {
        return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
      }

      // keep default clearing scoped properly
      const result = await prisma.$transaction(async (tx) => {
        const updated = await tx.savedView.update({
          where: { id: existing.id },
          data: {
            name,
            filters: filtersPayload,
            sort,
            isDefault: markDefault,
            isShared: sharedFlag,
          },
        });

        if (markDefault) {
          await tx.savedView.updateMany({
            where: {
              tenantId: activeTenantId,
              scope,
              ownerId: ctx.user.id,
              NOT: { id: updated.id },
            },
            data: { isDefault: false },
          });
        }

        return updated;
      });

      savedView = result;
    } else {
      // Create
      const result = await prisma.$transaction(async (tx) => {
        const created = await tx.savedView.create({
          data: {
            tenantId: activeTenantId,
            ownerId: ctx.user.id,
            scope,
            name,
            filters: filtersPayload,
            sort,
            isDefault: markDefault,
            isShared: sharedFlag,
          },
        });

        if (markDefault) {
          await tx.savedView.updateMany({
            where: {
              tenantId: activeTenantId,
              scope,
              ownerId: ctx.user.id,
              NOT: { id: created.id },
            },
            data: { isDefault: false },
          });
        }

        return created;
      });

      savedView = result;
    }

    // Form UX: redirect back to ATS page
    if (mode === "form") {
      const redirectTo =
        safeStartsWithAtsPath(body.redirectTo) ? (body.redirectTo as string) : "/ats/applications";
      return NextResponse.redirect(new URL(redirectTo, req.url), { status: 303 });
    }

    return NextResponse.json({ ok: true, view: savedView });
  } catch (err) {
    console.error("POST /api/ats/views error:", err);
    return NextResponse.json(
      { ok: false, error: "Unexpected error saving view" },
      { status: 500 },
    );
  }
}
