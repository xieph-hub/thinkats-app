// app/api/ats/clients/[clientId]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getResourcinTenant } from "@/lib/tenant";

type RouteContext = {
  params: { clientId: string };
};

export async function POST(request: Request, ctx: RouteContext) {
  const { clientId } = ctx.params;

  const tenant = await getResourcinTenant();
  if (!tenant) {
    const url = new URL(
      `/ats/clients/${clientId}/edit?error=No+default+tenant`,
      request.url,
    );
    return NextResponse.redirect(url);
  }

  const client = await prisma.clientCompany.findFirst({
    where: { id: clientId, tenantId: tenant.id },
  });

  if (!client) {
    const url = new URL(
      "/ats/clients?error=Client+not+found",
      request.url,
    );
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
      `/ats/clients/${clientId}/edit?error=Client+name+is+required`,
      request.url,
    );
    return NextResponse.redirect(url);
  }

  try {
    await prisma.clientCompany.update({
      where: { id: client.id },
      data: {
        name,
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
    console.error("Error updating client:", err);
    const url = new URL(
      `/ats/clients/${clientId}/edit?error=Failed+to+update+client`,
      request.url,
    );
    return NextResponse.redirect(url);
  }

  const redirectUrl = new URL(
    `/ats/clients/${clientId}/edit?updated=1`,
    request.url,
  );
  return NextResponse.redirect(redirectUrl);
}
