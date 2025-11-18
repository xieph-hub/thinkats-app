// lib/jobs.ts
import { createServerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function getJobsForTenant(tenantId: string) {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: () => cookieStore }
  );

  const { data, error } = await supabase
    .from('jobs')
    .select(
      `
      id,
      title,
      department,
      location,
      employment_type,
      seniority,
      status,
      visibility,
      created_at
    `
    )
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return data ?? [];
}
