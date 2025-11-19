// app/api/jobs/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentTenantId } from "@/lib/tenant"  // ✅ your existing tenant helper

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const {
      clientCompanyId,
      title,
      slug,
      location,
      function: jobFunction,
      employmentType,
      seniority,
      summary,
      description,
      tags,
    } = body

    // Basic validation
    if (!title || !slug || !location) {
      return NextResponse.json(
        { error: "title, slug, and location are required" },
        { status: 400 }
      )
    }

    // ✅ Use tenant UUID from Supabase
    const tenantId = getCurrentTenantId()

    // ✅ Create job and connect to tenant
    const job = await prisma.job.create({
      data: {
        clientCompanyId: clientCompanyId ?? null,
        title,
        slug,
        location,
        function: jobFunction ?? null,
        employmentType: employmentType ?? null,
        seniority: seniority ?? null,
        summary: summary ?? null,
        description: description ?? null,
        tags: tags ?? [],
        isPublished: false,
        tenant: {
          connect: { id: tenantId }, // 👈 fixes the “Argument tenant is missing” error
        },
      },
    })

    return NextResponse.json(job, { status: 201 })
  } catch (error) {
    console.error("❌ Error creating job:", error)
    return NextResponse.json(
      { error: "Failed to create job" },
      { status: 500 }
    )
  }
}
