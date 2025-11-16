import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

const DEFAULT_TENANT_ID = process.env.DEFAULT_TENANT_ID ?? "default-tenant";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      companyName,
      contactName,
      contactEmail,
      contactPhone,
      roleTitle,
      roleLevel,
      roleFunction,
      location,
      workType,
      employmentType,
      budgetCurrency,
      budgetMin,
      budgetMax,
      hiresCount,
      notes,
    } = body as {
      companyName?: string;
      contactName?: string;
      contactEmail?: string;
      contactPhone?: string;
      roleTitle?: string;
      roleLevel?: string;
      roleFunction?: string;
      location?: string;
      workType?: string;
      employmentType?: string;
      budgetCurrency?: string;
      budgetMin?: number;
      budgetMax?: number;
      hiresCount?: number;
      notes?: string;
    };

    // Basic validation
    if (!companyName || !contactName || !contactEmail || !roleTitle) {
      return NextResponse.json(
        {
          error:
            "companyName, contactName, contactEmail and roleTitle are required",
        },
        { status: 400 }
      );
    }

    const normalizedEmail = contactEmail.trim().toLowerCase();

    const request = await prisma.talentRequest.create({
      data: {
        tenantId: DEFAULT_TENANT_ID,

        companyName,
        contactName,
        contactEmail: normalizedEmail,
        contactPhone: contactPhone ?? null,

        roleTitle,
        roleLevel: roleLevel ?? null,
        function: roleFunction ?? null,
        location: location ?? null,
        workType: workType ?? null,
        employmentType: employmentType ?? null,

        budgetCurrency: budgetCurrency ?? null,
        budgetMin: budgetMin ?? null,
        budgetMax: budgetMax ?? null,
        hiresCount: hiresCount ?? null,

        notes: notes ?? null,
        // status defaults to "new"
      },
    });

    return NextResponse.json(
      { ok: true, id: request.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in /api/request-talent", error);
    return NextResponse.json(
      { error: "Something went wrong submitting talent request" },
      { status: 500 }
    );
  }
}
