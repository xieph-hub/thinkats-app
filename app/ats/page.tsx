// app/ats/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { prisma } from "@/lib/prisma";
import { ensureOtpVerified } from "@/lib/requireOtp";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ATS workspaces | ThinkATS",
  description:
    "Choose which ATS workspace to work in, or see how to get access.",
};

function roleLabel(raw: string | null | undefined): string {
  if (!raw) return "Member";
  const r = raw.toLowerCase();
  if (r === "owner") return "Owner";
  if (r === "admin") return "Admin";
  if (r === "recruiter") return "Recruiter";
  if (r === "hiring_manager") return "Hiring manager";
  if (r === "viewer") return "Viewer";
  return r.charAt(0).toUpperCase() + r.slice(1);
}

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

async function getCurrentAppUser() {
  const cookieStore = cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        // For SSR we only need read access
        set() {},
        remove() {},
      },
    },
  );

  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user || !data.user.email) {
    return null;
  }

  const email = data.user.email.toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      fullName: true,
      email: true,
      globalRole: true,
    },
  });

  return user;
}

export default async function AtsLandingPage() {
  // OTP gate like other ATS admin surfaces
  await ensureOtpVerified("/ats");

  const appUser = await getCurrentAppUser();

  if (!appUser) {
    redirect("/login?returnTo=/ats");
  }

  const memberships = await prisma.userTenantRole.findMany({
    where: { userId: appUser.id },
    include: {
      tenant: true,
    },
    orderBy: { createdAt: "asc" },
  });

  const count = memberships.length;

  // CASE 1: No workspace at all
  if (count === 0) {
    // SUPER_ADMIN can go to full tenants admin
    if (appUser.globalRole === "SUPER_ADMIN") {
      return redirect("/ats/tenants");
    }

    return (
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-10 lg:px-0">
        <header className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            ATS
          </p>
          <h1 className="text-2xl font-semibold text-slate-900">
            No ATS workspace yet
          </h1>
          <p className="text-xs text-slate-600">
            Your ThinkATS account is active, but you don&apos;t have access to
            any ATS workspaces yet.
          </p>
        </header>

        <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 text-xs shadow-sm">
          <p className="text-[11px] text-slate-600">
            To start using the ATS, you&apos;ll need to be added to a workspace
            by an owner or admin.
          </p>
          <ul className="list-disc space-y-1 pl-5 text-[11px] text-slate-600">
            <li>
              Ask your team to invite{" "}
                <span className="font-mono text-[11px]">
                  {appUser.email ?? "your email"}
                </span>{" "}
              to the correct workspace.
            </li>
            <li>
              If you think this is a mistake, contact your workspace admin or
              reach out to{" "}
              <a
                href="mailto:hello@thinkats.com"
                className="font-medium text-[#172965] underline-offset-2 hover:underline"
              >
                hello@thinkats.com
              </a>
              .
            </li>
          </ul>

          <div className="pt-2 text-[11px] text-slate-500">
            <span className="font-medium text-slate-700">Tip:</span> Once
            you&apos;re invited, email links will take you straight into the
            correct workspace.
          </div>
        </section>

        <div className="pt-2 text-[11px]">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-800"
          >
            <span className="text-xs">←</span>
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  // CASE 2: One or many workspaces -> show picker ALWAYS (no redirect)
  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-10 lg:px-0">
      <header className="space-y-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          ATS
        </p>
        <h1 className="text-2xl font-semibold text-slate-900">
          Choose a workspace
        </h1>
        <p className="text-xs text-slate-600">
          Your account has access to {count} ATS workspace
          {count === 1 ? "" : "s"}. Pick where you want to work.
        </p>
      </header>

      <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 text-xs shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
              Workspaces
            </p>
            <p className="text-[11px] text-slate-600">
              You have access to {count} ATS workspace
              {count === 1 ? "" : "s"}.
            </p>
          </div>
        </div>

        <div className="mt-2 grid gap-3 md:grid-cols-2">
          {memberships.map((membership) => {
            const t = membership.tenant;
            if (!t) return null;

            const slug = t.slug;
            const status = (t.status || "").toLowerCase();
            const isActive = status === "active";

            return (
              <Link
                key={membership.id}
                href={`/ats/jobs?tenantId=${encodeURIComponent(
                  membership.tenantId,
                )}`}
                className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50/60 p-4 transition hover:border-[#172965] hover:bg-white hover:shadow-sm"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-sm font-semibold text-slate-900">
                      {t.name}
                    </h2>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ${
                        isActive
                          ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                          : "bg-slate-50 text-slate-500 ring-slate-200"
                      }`}
                    >
                      {isActive ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500">
                    Role:{" "}
                    <span className="font-medium">
                      {roleLabel(membership.role)}
                    </span>
                    {membership.isPrimary && (
                      <span className="ml-2 rounded-full bg-slate-900/90 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white">
                        Primary
                      </span>
                    )}
                  </p>

                  {slug && (
                    <p className="text-[11px] text-slate-500">
                      Slug:{" "}
                      <code className="rounded bg-slate-100 px-1 py-0.5">
                        {slug}
                      </code>
                    </p>
                  )}
                </div>

                <div className="mt-3 flex items-center justify-between text-[10px] text-slate-400">
                  <span>Joined {formatDate(membership.createdAt)}</span>
                  <span className="inline-flex items-center gap-1 text-[#172965] group-hover:text-[#0f193e]">
                    Open workspace
                    <span className="text-[9px]">↗</span>
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <div className="pt-2 text-[11px]">
        <Link
          href="/ats/tenants"
          className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-800"
        >
          <span className="text-xs">⚙</span>
          Manage all workspaces
        </Link>
      </div>
    </div>
  );
}
