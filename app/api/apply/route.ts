import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

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
    } = body as {
      jobId?: string;
      name?: string;
      email?: string;
      phone?: string;
      city?: string;
      country?: string;
      cvUrl?: string;
      source?: string;
    };

    if (!jobId || !name || !email) {
      return NextResponse.json(
        { error: "jobId, name and email are required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // For now: simple default tenant.
    // Later we’ll read this from session / domain / header.
    const tenantId = process.env.DEFAULT_TENANT_ID ?? "default-tenant";

    import { getDefaultTenant } from "@/lib/tenant"; // make sure this is at the top

// somewhere near the top of POST handler
const tenant = await getDefaultTenant();

// …

const candidate = await prisma.candidate.upsert({
  where: {
    tenantId_email: {
      tenantId: tenant.id,
      email: normalizedEmail,
    },
  },
  update: {
    // your existing update fields (fullName, phone, etc.)
  },
  create: {
    tenantId: tenant.id,
    email: normalizedEmail,
    // your existing create fields (fullName, phone, etc.)
  },
});

    const application = await prisma.jobApplication.create({
      data: {
        // relations
        job: {
          connect: { id: jobId },
        },
        candidate: {
          connect: { id: candidate.id },
        },

        // required scalar snapshot fields on JobApplication model
        fullName: name,
        email: normalizedEmail,
        cvUrl: cvUrl ?? "", // satisfies required `cvUrl` in schema

        // if you have this in schema with default, you can omit it
        // status: "applied",
        // source: source ?? "job_board",
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
