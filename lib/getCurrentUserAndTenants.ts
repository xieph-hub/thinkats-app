// lib/getCurrentUserAndTenants.ts
import { createServerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function getCurrentUserAndTenants() {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: () => cookieStore }
  );

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) return { user: null, tenants: [] };

  // Get user profile (public.users)
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profileError) throw profileError;

  // Get all tenant memberships
  const { data: roles, error: rolesError } = await supabase
    .from('user_tenant_roles')
    .select(
      `
      id,
      role,
      is_primary,
      tenant:tenants (
        id,
        slug,
        name,
        status
      )
    `
    )
    .eq('user_id', user.id);

  if (rolesError) throw rolesError;

  const tenants = roles?.map((r) => r.tenant) ?? [];

  // Pick a "current" tenant (e.g. primary, or first)
  const currentTenant =
    roles?.find((r) => r.is_primary)?.tenant ?? tenants[0] ?? null;

  return { user, profile, roles, tenants, currentTenant };
}
