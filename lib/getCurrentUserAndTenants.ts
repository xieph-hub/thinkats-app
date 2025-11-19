// lib/getCurrentUserAndTenants.ts
import { createSupabaseServerClient } from "./supabaseServerClient";

type TenantRoleRow = {
  id: string;
  user_id: string;
  tenant_id: string;
  role: string;
  tenant: {
    id: string;
    name: string | null;
    slug: string | null;
  } | null;
};

export async function getCurrentUserAndTenants() {
  const supabase = createSupabaseServerClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    console.error("Error getting auth user", userError);
  }

  if (!user) {
    return {
      user: null,
      roles: [] as TenantRoleRow[],
      tenants: [] as TenantRoleRow["tenant"][],
      currentTenant: null as TenantRoleRow["tenant"] | null,
    };
  }

  const { data: roles, error: rolesError } = await supabase
    .from("user_tenant_roles")
    .select(
      `
      id,
      user_id,
      tenant_id,
      role,
      tenant:tenants(
        id,
        name,
        slug
      )
    `
    )
    .eq("user_id", user.id);

  if (rolesError) {
    console.error("Error loading user_tenant_roles", rolesError);
    return {
      user,
      roles: [],
      tenants: [],
      currentTenant: null,
    };
  }

  const tenants =
    roles?.map((r: TenantRoleRow) => r.tenant).filter(Boolean) ?? [];

  const currentTenant =
    tenants.length > 0 ? tenants[0] : null;

  return {
    user,
    roles: (roles as TenantRoleRow[]) ?? [],
    tenants,
    currentTenant,
  };
}
