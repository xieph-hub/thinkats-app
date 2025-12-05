// app/api/ats/email-templates/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getResourcinTenant } from "@/lib/tenant";

export const runtime = "nodejs";

export async function GET() {
  try {
    const tenant = await getResourcinTenant();
    if (!tenant) {
      return NextResponse.json(
        { ok: false, error: "No tenant configured" },
        { status: 400 },
      );
    }

    const templates = await prisma.emailTemplate.findMany({
      where: { tenantId: tenant.id },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(
      {
        ok: true,
        templates: templates.map((t) => ({
          id: t.id,
          name: t.name,
          subject: t.subject,
          body: t.body,
          templateType: t.templateType ?? null,
          isDefault: t.isDefault,
        })),
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("Email templates GET error:", err);
    return NextResponse.json(
      { ok: false, error: "Unexpected error fetching templates" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const tenant = await getResourcinTenant();
    if (!tenant) {
      return NextResponse.json(
        { ok: false, error: "No tenant configured" },
        { status: 400 },
      );
    }

    const body = await req.json().catch(() => ({} as any));
    const id = (body.id as string | undefined) ?? null;
    const name = ((body.name as string | undefined) ?? "").trim();
    const subject = ((body.subject as string | undefined) ?? "").trim();
    const content = ((body.body as string | undefined) ?? "").trim();
    const templateType =
      (body.templateType as string | undefined) ?? null;
    const makeDefault = Boolean(body.makeDefault);

    if (!name || !subject || !content) {
      return NextResponse.json(
        { ok: false, error: "Name, subject and body are required." },
        { status: 400 },
      );
    }

    let templateId = id;

    if (id) {
      // Update existing
      const existing = await prisma.emailTemplate.findFirst({
        where: {
          id,
          tenantId: tenant.id,
        },
      });

      if (!existing) {
        return NextResponse.json(
          { ok: false, error: "Template not found for this tenant" },
          { status: 404 },
        );
      }

      await prisma.emailTemplate.update({
        where: { id: existing.id },
        data: {
          name,
          subject,
          body: content,
          templateType,
        },
      });

      templateId = existing.id;
    } else {
      // Create new
      const created = await prisma.emailTemplate.create({
        data: {
          tenantId: tenant.id,
          name,
          subject,
          body: content,
          templateType,
          isDefault: false, // we may flip below
        },
      });
      templateId = created.id;
    }

    // Handle default flag
    if (makeDefault && templateId) {
      await prisma.emailTemplate.updateMany({
        where: {
          tenantId: tenant.id,
        },
        data: {
          isDefault: false,
        },
      });

      await prisma.emailTemplate.update({
        where: { id: templateId },
        data: { isDefault: true },
      });
    }

    const templates = await prisma.emailTemplate.findMany({
      where: { tenantId: tenant.id },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(
      {
        ok: true,
        templateId,
        templates: templates.map((t) => ({
          id: t.id,
          name: t.name,
          subject: t.subject,
          body: t.body,
          templateType: t.templateType ?? null,
          isDefault: t.isDefault,
        })),
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("Email templates POST error:", err);
    return NextResponse.json(
      { ok: false, error: "Unexpected error saving template" },
      { status: 500 },
    );
  }
}
