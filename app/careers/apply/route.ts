// app/api/careers/apply/route.ts
import { NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabaseServiceClient';

export async function POST(req: Request) {
  const body = await req.json();
  const {
    tenant_slug,
    job_id,
    full_name,
    email,
    phone,
    location,
    linkedin_url,
    source = 'careers_site',
  } = body;

  // 1. Look up tenant
  const { data: tenant, error: tenantError } = await supabaseService
    .from('tenants')
    .select('id')
    .eq('slug', tenant_slug)
    .single();

  if (tenantError || !tenant) {
    return NextResponse.json(
      { error: 'Invalid tenant' },
      { status: 400 }
    );
  }

  // 2. Find or create candidate
  const { data: existingCandidates } = await supabaseService
    .from('candidates')
    .select('id')
    .eq('tenant_id', tenant.id)
    .eq('email', email);

  let candidateId: string;

  if (existingCandidates && existingCandidates.length > 0) {
    candidateId = existingCandidates[0].id;
  } else {
    const { data: newCandidate, error: candError } = await supabaseService
      .from('candidates')
      .insert({
        tenant_id: tenant.id,
        full_name,
        email,
        phone,
        location,
        linkedin_url,
        source,
      })
      .select('id')
      .single();

    if (candError || !newCandidate) {
      return NextResponse.json({ error: 'Could not create candidate' }, { status: 500 });
    }

    candidateId = newCandidate.id;
  }

  // 3. Get "Applied" stage for the job
  const { data: stage, error: stageError } = await supabaseService
    .from('job_stages')
    .select('id')
    .eq('job_id', job_id)
    .eq('name', 'Applied')
    .single();

  if (stageError || !stage) {
    return NextResponse.json({ error: 'No Applied stage configured' }, { status: 500 });
  }

  // 4. Create application
  const { data: app, error: appError } = await supabaseService
    .from('applications')
    .insert({
      tenant_id: tenant.id,
      job_id,
      candidate_id: candidateId,
      current_stage_id: stage.id,
      status: 'active',
      applied_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (appError || !app) {
    return NextResponse.json({ error: 'Could not create application' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
