// app/careers/page.tsx
import { headers } from 'next/headers';
import { createServerClient } from '@supabase/auth-helpers-nextjs';

export default async function CareersPage() {
  const hdrs = headers();
  const tenantSlug = hdrs.get('x-tenant-slug'); // e.g. "acme"

  // If no tenant slug -> maybe show 404 or redirect
  if (!tenantSlug) {
    // either show generic careers or 404
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Get tenant and settings
  const { data: tenant } = await supabase
    .from('tenants')
    .select('id, name')
    .eq('slug', tenantSlug)
    .single();

  if (!tenant) {
    // 404
  }

  const { data: settings } = await supabase
    .from('career_site_settings')
    .select('*')
    .eq('tenant_id', tenant.id)
    .single();

  const { data: jobs } = await supabase
    .from('jobs')
    .select('id, title, department, location, employment_type')
    .eq('tenant_id', tenant.id)
    .eq('status', 'open')
    .eq('visibility', 'public')
    .order('created_at', { ascending: false });

  // render a career page using settings + jobs
}
