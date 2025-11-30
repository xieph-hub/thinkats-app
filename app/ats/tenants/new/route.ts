// app/ats/tenants/new/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function POST(req: Request) {
  const formData = await req.formData();
  const nameRaw = formData.get("name");
  const slugRaw = formData.get("slug");

  const name = typeof nameRaw === "string" ? nameRaw.trim() : "";
  let slug = typeof slugRaw === "string" ? slugRaw.trim() : "";

  if (!name) {
    const url = new URL("/ats/tenants", req.url);
    url.searchParams.set("error", "missing_name");
    return NextResponse.redirect(url, 303);
  }

  if (!slug) {
    slug = slugify(name);
  }

  try {
    await prisma.tenant.create({
      data: {
        name,
        slug,
      },
    });

    const url = new URL("/ats/tenants", req.url);
    url.searchParams.set("created", "1");
    return NextResponse.redirect(url, 303);
  } catch (err) {
    console.error("Failed to create tenant", err);
    const url = new URL("/ats/tenants", req.url);
    url.searchParams.set("error", "create_failed");
    return NextResponse.redirect(url, 303);
  }
}
