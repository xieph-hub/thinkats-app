// lib/getCurrentUserAndTenants.ts
import { createSupabaseServerClient } from "./supabaseServerClient";

export async function getCurrentUserAndTenants() {
  const supabase = createSupabaseServerClient();

  // Get authenticated user (from auth.users)
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      user: null,
      profile: null,
      roles: [],
      tenants: [],
      currentTenant: null,
    };
  }

  // 1) Get user profile from public.users
  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profileError) {
    throw profileError;
  }

  // 2) Get tenant memberships from user_tenant_roles
  const { data: roles, error: rolesError } = await supabase
    .from("user_tenant_roles")
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
    .eq("user_id", user.id);

  if (rolesError) {
    throw rolesError;
  }

  const tenants = roles?.map((r: any) => r.tenant) ?? [];
  const currentTenant =
    roles?.find((r: any) => r.is_primary)?.tenant ?? tenants[0] ?? null;

  return {
    user,
    profile,
    roles: roles ?? [],
    tenants,
    currentTenant,
  };
}
