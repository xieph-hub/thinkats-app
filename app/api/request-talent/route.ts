// app/api/request-talent/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDefaultTenant } from "@/lib/tenant";

export async function POST(req: Request) {
  try {
    const tenant = await getDefaultTenant();
    const formData = await req.formData();

    const name = (formData.get("name") as string | null) ?? "";
    const company = (formData.get("company") as string | null) ?? "";
    const email = (formData.get("email") as string | null) ?? "";
    const phone = (formData.get("phone") as string | null) ?? "";

    const roles = (formData.get("roles") as string | null) ?? "";
    const headcountRaw = (formData.get("headcount") as string | null) ?? "";
    const locations = (formData.get("locations") as string | null) ?? "";
    const budget = (formData.get("budget") as string | null) ?? "";
    const timeline = (formData.get("timeline") as string | null) ?? "";
    const notesRaw = (formData.get("notes") as string | null) ?? "";

    const hiresCount = headcountRaw
      ? Number.parseInt(headcountRaw, 10)
      : null;

    const mergedNotes = [
      notesRaw.trim() || null,
      budget.trim() ? `Budget (per role): ${budget.trim()}` : null,
      timeline.trim() ? `Ideal start date: ${timeline.trim()}` : null,
    ]
      .filter(Boolean)
      .join("\n\n");

    if (!company || !name || !email || !roles) {
      return NextResponse.json(
        { ok: false, error: "Missing required fields." },
        { status: 400 }
      );
    }

    await prisma.talentRequest.create({
      data: {
        tenantId: tenant.id,
        companyName: company,
        contactName: name,
        contactEmail: email,
        contactPhone: phone || null,
        roleTitle: roles, // free-text description of roles
        roleLevel: null,
        function: null,
        location: locations || null,
        workType: null,
        employmentType: null,
        budgetCurrency: null,
        budgetMin: null,
        budgetMax: null,
        hiresCount: hiresCount && !Number.isNaN(hiresCount) ? hiresCount : null,
        notes: mergedNotes || null,
        status: "new",
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Error creating talent request:", err);
    return NextResponse.json(
      { ok: false, error: "Failed to submit brief." },
      { status: 500 }
    );
  }
}
