// lib/getCurrentUserAndTenants.ts
import { createSupabaseServerClient } from './supabaseServerClient';

export type Tenant = {
  id: string;
  name: string | null;
  slug: string | null;
};

export type CurrentUserAndTenants = {
  user: {
    id: string;
    email: string | null;
  } | null;
  tenants: Tenant[];
  currentTenant: Tenant | null;
};

/**
 * Reads the current authenticated user (from Supabase auth cookies)
 * plus the tenants they belong to.
 *
 * This function is defensive: any error just returns { user: null, tenants: [] }.
 */
export async function getCurrentUserAndTenants(): Promise<CurrentUserAndTenants> {
  try {
    const supabase = await createSupabaseServerClient();

    // 1) Current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.error('Supabase getUser error', userError);
    }

    if (!user) {
      // Not logged in
      return {
        user: null,
        tenants: [],
        currentTenant: null,
      };
    }

    // 2) Tenant roles for this user
    const {
      data: rolesRaw,
      error: rolesError,
    } = await supabase
      .from('user_tenant_roles')
      .select('id, user_id, tenant_id, role')
      .eq('user_id', user.id);

    if (rolesError) {
      console.error('Supabase user_tenant_roles error', rolesError);
    }

    const tenantIds: string[] =
      rolesRaw
        ?.map((r: any) => r.tenant_id)
        .filter((id: any) => !!id)
        .map((id: any) => String(id)) ?? [];

    // 3) Fetch tenants
    let tenants: Tenant[] = [];

    if (tenantIds.length > 0) {
      const {
        data: tenantsRaw,
        error: tenantsError,
      } = await supabase
        .from('tenants')
        .select('id, name, slug')
        .in('id', tenantIds);

      if (tenantsError) {
        console.error('Supabase tenants error', tenantsError);
      }

      tenants =
        tenantsRaw?.map((t: any) => ({
          id: String(t.id),
          name: t.name ?? null,
          slug: t.slug ?? null,
        })) ?? [];
    }

    const currentTenant = tenants.length > 0 ? tenants[0] : null;

    return {
      user: {
        id: user.id,
        email: user.email ?? null,
      },
      tenants,
      currentTenant,
    };
  } catch (err) {
    console.error('getCurrentUserAndTenants fatal error', err);
    return {
      user: null,
      tenants: [],
      currentTenant: null,
    };
  }
}
