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

    // Upsert candidate by email so the same person doesn't get duplicated
    const candidate = await prisma.candidate.upsert({
      where: { email: normalizedEmail },
      update: {
        fullName: name,
        phone: phone ?? null,
        cvUrl: cvUrl ?? null,
        source: source ?? "job_board",
        status: "active",
      },
      create: {
        fullName: name,
        email: normalizedEmail,
        phone: phone ?? null,
        city: city ?? null,
        country: country ?? null,
        cvUrl: cvUrl ?? null,
        source: source ?? "job_board",
        status: "active",
      },
    });

    const application = await prisma.application.create({
      data: {
        jobId,
        candidateId: candidate.id,
        status: "applied",
        source: source ?? "job_board",
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
