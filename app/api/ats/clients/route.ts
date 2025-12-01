// app/api/ats/clients/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getResourcinTenant } from "@/lib/tenant";

export async function POST(request: Request) {
  const tenant = await getResourcinTenant();
  if (!tenant) {
    const url = new URL("/ats/clients?error=No+default+tenant", request.url);
    return NextResponse.redirect(url);
  }

  const formData = await request.formData();
  const rawName = (formData.get("name") as string | null) ?? "";
  const rawWebsite = (formData.get("website") as string | null) ?? "";
  const rawIndustry = (formData.get("industry") as string | null) ?? "";
  const rawLogoUrl = (formData.get("logoUrl") as string | null) ?? "";
  const rawSlug =
    (formData.get("careersiteSlug") as string | null) ?? "";
  const rawCustomDomain =
    (formData.get("careersiteCustomDomain") as string | null) ?? "";
  const rawNotes = (formData.get("notes") as string | null) ?? "";
  const rawEnabled = formData.get("careersiteEnabled");

  const name = rawName.trim();
  const website = rawWebsite.trim() || null;
  const industry = rawIndustry.trim() || null;
  const logoUrl = rawLogoUrl.trim() || null;
  const careersiteSlug = rawSlug.trim() || null;
  const careersiteCustomDomain = rawCustomDomain.trim() || null;
  const notes = rawNotes.trim() || null;
  const careersiteEnabled = rawEnabled === "on";

  if (!name) {
    const url = new URL(
      "/ats/clients?error=Client+name+is+required",
      request.url,
    );
    return NextResponse.redirect(url);
  }

  try {
    await prisma.clientCompany.create({
      data: {
        name,
        tenantId: tenant.id,
        website,
        industry,
        logoUrl,
        careersiteSlug,
        careersiteCustomDomain,
        careersiteEnabled,
        notes,
      },
    });
  } catch (err) {
    console.error("Error creating client:", err);
    const url = new URL(
      "/ats/clients?error=Failed+to+create+client",
      request.url,
    );
    return NextResponse.redirect(url);
  }

  const redirectUrl = new URL("/ats/clients?created=1", request.url);
  return NextResponse.redirect(redirectUrl);
}
