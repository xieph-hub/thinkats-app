import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

// Default tenant fallback (can be overridden by body or headers)
const DEFAULT_TENANT_ID = process.env.DEFAULT_TENANT_ID ?? "resourcin-main";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      jobId,
      name,
      email,
      phone,
      city,
      country,
      cvUrl,
      source,
      tenantId: tenantIdFromBody,
    } = body as {
      jobId?: string;
      name?: string;
      email?: string;
      phone?: string;
      city?: string;
      country?: string;
      cvUrl?: string;
      source?: string;
      tenantId?: string;
    };

    if (!jobId || !name || !email) {
      return NextResponse.json(
        { error: "jobId, name and email are required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Resolve tenantId: body → header → default
    const tenantId =
      tenantIdFromBody ??
      req.headers.get("x-tenant-id") ??
      DEFAULT_TENANT_ID;

    // Upsert candidate by (email, tenantId) so the same person isn't duplicated per tenant
    const candidate = await prisma.candidate.upsert({
      where: {
        // relies on @@unique([email, tenantId], name: "email_tenantId") in your Prisma schema
        email_tenantId: {
          email: normalizedEmail,
          tenantId,
        },
      },
      update: {
        fullName: name,
        phone: phone ?? null,
        cvUrl: cvUrl ?? null,
        // you can add fields here later if you put city/country/source on Candidate
      },
      create: {
        tenantId, // 🔑 required for the Candidate–Tenant relation
        fullName: name,
        email: normalizedEmail,
        phone: phone ?? null,
        cvUrl: cvUrl ?? null,
        // city, country, source NOT set here because they don't exist on Candidate in your schema yet
      },
    });

    const application = await prisma.application.create({
      data: {
        jobId,
        candidateId: candidate.id,
        status: "applied",
        // if your Application model has source / city / country fields,
        // you can safely add them here instead:
        // source: source ?? "job_board",
        // city,
        // country,
      },
    });

    return NextResponse.json(
      {
        ok: true,
        applicationId: application.id,
        candidateId: candidate.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in /api/apply", error);
    return NextResponse.json(
      { error: "Something went wrong submitting application" },
      { status: 500 }
    );
  }
}
