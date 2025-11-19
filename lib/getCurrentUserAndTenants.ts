// lib/getCurrentUserAndTenants.ts
import { createSupabaseServerClient } from "./supabaseServerClient";

type TenantRow = {
  id: string;
  name: string | null;
  slug: string | null;
};

type TenantRoleRow = {
  id: string;
  user_id: string;
  tenant_id: string;
  role: string;
  // Supabase returns this join as an array type in the generated types,
  // so we treat it as an array and then flatten below.
  tenant: TenantRow[] | null;
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
      tenants: [] as TenantRow[],
      currentTenant: null as TenantRow | null,
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
      tenant:tenants (
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
      roles: [] as TenantRoleRow[],
      tenants: [] as TenantRow[],
      currentTenant: null as TenantRow | null,
    };
  }

  const typedRoles = (roles ?? []) as TenantRoleRow[];

  // Supabase gives us tenant as an array; flatten into a simple list of tenants.
  const tenants: TenantRow[] = typedRoles.flatMap((r) => r.tenant ?? []);

  const currentTenant: TenantRow | null =
    tenants.length > 0 ? tenants[0] : null;

  return {
    user,
    roles: typedRoles,
    tenants,
    currentTenant,
  };
}
