// app/api/ats/settings/workspace/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getResourcinTenant } from "@/lib/tenant";

function normaliseSlug(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function POST(request: Request) {
  const tenant = await getResourcinTenant();

  if (!tenant) {
    const url = new URL("/ats/settings/workspace?error=No+default+tenant", request.url);
    return NextResponse.redirect(url);
  }

  const formData = await request.formData();
  const rawName = (formData.get("name") as string | null) ?? "";
  const rawSlug = (formData.get("slug") as string | null) ?? "";

  const name = rawName.trim();
  const slugInput = rawSlug.trim();

  if (!name) {
    const url = new URL(
      "/ats/settings/workspace?error=Workspace+name+is+required",
      request.url,
    );
    return NextResponse.redirect(url);
  }

  const slug = slugInput ? normaliseSlug(slugInput) : null;

  try {
    await prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        name,
        // adjust if your field is different
        slug,
      },
    });
  } catch (err) {
    console.error("Error updating workspace:", err);
    const url = new URL(
      "/ats/settings/workspace?error=Failed+to+save+workspace",
      request.url,
    );
    return NextResponse.redirect(url);
  }

  const redirectUrl = new URL("/ats/settings/workspace?updated=1", request.url);
  return NextResponse.redirect(redirectUrl);
}
