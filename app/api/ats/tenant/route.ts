// app/api/ats/tenants/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, assertSuperAdmin } from "@/lib/auth";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  try {
    assertSuperAdmin(user);
  } catch (err: any) {
    const status = err?.statusCode ?? 403;
    return NextResponse.json(
      { error: "Forbidden – SUPER_ADMIN only" },
      { status },
    );
  }

  const body = await req.json().catch(() => null) as
    | { name?: string; slug?: string }
    | null;

  const name = body?.name?.trim();
  const slug = body?.slug?.trim();

  if (!name || !slug) {
    return NextResponse.json(
      { error: "Missing 'name' or 'slug'" },
      { status: 400 },
    );
  }

  const existing = await prisma.tenant.findFirst({
    where: { slug },
  });

  if (existing) {
    return NextResponse.json(
      { error: "Tenant with this slug already exists" },
      { status: 409 },
    );
  }

  const tenant = await prisma.tenant.create({
    data: {
      name,
      slug,
      status: "active",
    },
  });

  return NextResponse.json(tenant, { status: 201 });
}
