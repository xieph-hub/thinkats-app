// app/ats/page.tsx
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ensureOtpVerified } from "@/lib/requireOtp";
import { createSupabaseRouteClient } from "@/lib/supabaseRouteClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ThinkATS | Workspaces",
  description: "Switch between ATS workspaces you have access to.",
};

function formatDate(value: any): string {
  if (!value) return "";
  const d =
    typeof value === "string" || typeof value === "number"
      ? new Date(value)
      : value;
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function roleLabel(raw: string | null | undefined): string {
  if (!raw) return "Member";
  const r = raw.toLowerCase();
  if (r === "owner") return "Owner";
  if (r === "admin") return "Admin";
  if (r === "recruiter") return "Recruiter";
  if (r === "hiring_manager") return "Hiring manager";
  return r.charAt(0).toUpperCase() + r.slice(1);
}

export default async function AtsLandingPage() {
  // Enforce OTP verification before letting someone into ATS.
  await ensureOtpVerified("/ats");

  // Map Supabase user -> app-level user
  const supabase = createSupabaseRouteClient();
  const {
    data: { user: supaUser },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !supaUser || !supaUser.email) {
    redirect("/login?next=/ats");
  }

  const email = supaUser.email.toLowerCase();

  let appUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true, fullName: true },
  });

  if (!appUser) {
    appUser = await prisma.user.create({
      data: {
        email,
        fullName:
          (supaUser.user_metadata as any)?.full_name ??
          supaUser.email.split("@")[0] ??
          null,
        globalRole: "USER",
        isActive: true,
      },
      select: { id: true, fullName: true },
    });
  }

  const memberships = await prisma.userTenantRole.findMany({
    where: { userId: appUser.id },
    include: {
      tenant: {
        select: {
          id: true,
          name: true,
          slug: true,
          plan: true,
          createdAt: true,
          status: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  // 0 workspaces – helpful empty state
  if (memberships.length === 0) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-3xl flex-col justify-center px-4 py-10 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          ATS · Workspaces
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">
          No workspaces yet
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Your account is active, but you don&apos;t belong to any ATS
          workspace yet. Ask your team to send you an invitation, or contact
          ThinkATS support to get a workspace created.
        </p>
        <div className="mt-6 flex justify-center">
          <a
            href="mailto:hello@thinkats.com"
            className="inline-flex items-center rounded-full bg-[#172965] px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[#101d4a]"
          >
            Contact support
          </a>
        </div>
      </div>
    );
  }

  // 1 workspace – go straight in
  if (memberships.length === 1) {
    const only = memberships[0];
    return redirect(`/ats/tenants/${only.tenantId}/jobs`);
  }

  // Multiple workspaces – chooser
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <header className="mb-6 border-b border-slate-200 pb-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          ATS · Workspaces
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">
          Choose a workspace
        </h1>
        <p className="mt-1 text-xs text-slate-600">
          Your account has access to multiple ATS workspaces. Pick one to
          continue.
        </p>
      </header>

      <div className="space-y-3">
        {memberships.map((m) => (
          <a
            key={m.id}
            href={`/ats/tenants/${m.tenantId}/jobs`}
            className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs shadow-sm transition hover:border-[#172965] hover:shadow-md"
          >
            <div>
              <p className="font-semibold text-slate-900">
                {m.tenant?.name ?? "Workspace"}
              </p>
              <p className="mt-0.5 text-[11px] text-slate-500">
                Role: {roleLabel(m.role)} · Since{" "}
                {formatDate(m.tenant?.createdAt ?? null)}
              </p>
            </div>
            <span className="inline-flex items-center rounded-full bg-slate-50 px-3 py-1 text-[10px] font-medium text-slate-600">
              Open workspace →
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}
