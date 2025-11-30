// app/ats/clients/new/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const formData = await req.formData();
  const nameRaw = formData.get("name");
  const tenantIdRaw = formData.get("tenantId");

  const name = typeof nameRaw === "string" ? nameRaw.trim() : "";
  const tenantId =
    typeof tenantIdRaw === "string" ? tenantIdRaw.trim() : "";

  if (!name) {
    const url = new URL("/ats/clients", req.url);
    if (tenantId) url.searchParams.set("tenantId", tenantId);
    url.searchParams.set("error", "missing_name");
    return NextResponse.redirect(url, 303);
  }

  if (!tenantId) {
    const url = new URL("/ats/clients", req.url);
    url.searchParams.set("error", "missing_tenant");
    return NextResponse.redirect(url, 303);
  }

  try {
    await prisma.clientCompany.create({
      data: {
        name,
        tenantId,
      },
    });

    const url = new URL("/ats/clients", req.url);
    url.searchParams.set("tenantId", tenantId);
    url.searchParams.set("created", "1");
    return NextResponse.redirect(url, 303);
  } catch (err) {
    console.error("Failed to create client company", err);
    const url = new URL("/ats/clients", req.url);
    url.searchParams.set("tenantId", tenantId);
    url.searchParams.set("error", "create_failed");
    return NextResponse.redirect(url, 303);
  }
}
