import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

// Optional: fallback tenant for now
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

    // Upsert candidate by *email only* (matches your current Prisma schema)
    const candidate = await prisma.candidate.upsert({
      where: {
        email: normalizedEmail, // <- this exists in CandidateWhereUniqueInput
      },
      update: {
        tenantId, // keep this in sync
        fullName: name,
        phone: phone ?? null,
        cvUrl: cvUrl ?? null,
        // you can later add city / country / source to the Candidate model if you want
      },
      create: {
        tenantId, // required by your Candidate–Tenant relation
        fullName: name,
        email: normalizedEmail,
        phone: phone ?? null,
        cvUrl: cvUrl ?? null,
      },
    });

    const application = await prisma.jobApplication.create({
  data: {
    jobId,
    candidateId: candidate.id,
    // status: "applied", // optional if your schema has a default
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
