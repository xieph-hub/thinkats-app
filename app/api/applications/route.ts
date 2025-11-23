// app/api/applications/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantFromRequest } from '@/lib/tenant';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const tenant = await getTenantFromRequest(req);
  const formData = await req.formData();

  const jobId = formData.get('jobId')?.toString();
  const fullName = formData.get('fullName')?.toString() ?? '';
  const email = formData.get('email')?.toString() ?? '';
  const phone = formData.get('phone')?.toString() ?? '';
  const coverLetter = formData.get('coverLetter')?.toString() ?? '';
  const cvFile = formData.get('cv') as File | null;

  if (!jobId || !fullName || !email) {
    return NextResponse.json(
      { error: 'Missing required fields' },
      { status: 400 },
    );
  }

  const job = await prisma.job.findFirst({
    where: {
      id: jobId,
      tenantId: tenant.id,
      isPublished: true,
    },
  });

  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  // -------- CV upload to Supabase Storage --------
  let cvUrl: string | null = null;

  if (cvFile && cvFile.size > 0) {
    const bucket = process.env.SUPABASE_CV_BUCKET ?? 'cv-uploads';
    const arrayBuffer = await cvFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const path = `${tenant.id}/${job.id}/${Date.now()}-${cvFile.name}`;

    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .upload(path, buffer, {
        contentType: cvFile.type || 'application/octet-stream',
        upsert: false,
      });

    if (error) {
      console.error('Supabase storage upload error:', error);
    } else if (data) {
      const { data: publicUrlData } = supabaseAdmin.storage
        .from(bucket)
        .getPublicUrl(data.path);

      cvUrl = publicUrlData.publicUrl;
    }
  }

  // -------- Talent network (Candidate) --------
  const candidate = await prisma.candidate.upsert({
    where: {
      tenant_email_unique: {
        tenantId: tenant.id,
        email,
      },
    },
    update: {
      fullName,
      phone,
    },
    create: {
      tenantId: tenant.id,
      fullName,
      email,
      phone,
    },
  });

  // -------- Job application (pipeline) --------
  await prisma.jobApplication.create({
    data: {
      tenantId: tenant.id,
      jobId: job.id,
      candidateId: candidate.id,
      fullName,
      email,
      phone,
      cvUrl,
      coverLetter,
      source: 'careers_site',
      currentStage: 'APPLIED',
    },
  });

  const redirectUrl = new URL(
    `/jobs/${job.slug}?applied=1`,
    req.nextUrl.origin,
  );

  return NextResponse.redirect(redirectUrl);
}
