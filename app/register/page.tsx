import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Create first admin | ThinkATS",
  description:
    "Bootstrap your ThinkATS workspace by creating the first admin account.",
};

export default async function RegisterPage({
  searchParams,
}: {
  searchParams?: { error?: string };
}) {
  const error = searchParams?.error;

  const existingAdmin = await prisma.userTenantRole.findFirst({
    where: { role: "SUPER_ADMIN" },
  });

  const adminExists = !!existingAdmin;

  if (adminExists) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/80 p-6 text-sm text-slate-100 shadow-lg">
          <h1 className="text-lg font-semibold text-white">
            Create first admin
          </h1>
          <p className="mt-2 text-xs text-slate-300">
            This screen is only for bootstrapping your ThinkATS workspace. Once
            an admin exists, registration is disabled.
          </p>
          <p className="mt-3 text-xs text-amber-300">
            An account already exists. Go to login.
          </p>
          <div className="mt-4 flex justify-between gap-3 text-xs">
            <Link
              href="/login"
              className="inline-flex items-center rounded-full bg-[#172965] px-4 py-2 font-medium text-white hover:bg-[#0f1c48]"
            >
              Go to login
            </Link>
            <Link
              href="/"
              className="text-slate-400 hover:text-slate-200 hover:underline"
            >
              Back to site
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/80 p-6 text-sm text-slate-100 shadow-lg">
        <h1 className="text-lg font-semibold text-white">
          Create first admin
        </h1>
        <p className="mt-2 text-xs text-slate-300">
          This will create the first admin user and workspace owner. After this,
          new users are invited from inside the app.
        </p>

        {error && (
          <p className="mt-3 rounded border border-rose-500/50 bg-rose-500/10 px-2 py-1 text-[11px] text-rose-100">
            {error === "admin_exists"
              ? "An admin already exists. Please sign in instead."
              : "Something went wrong, please check your details and try again."}
          </p>
        )}

        <form
          method="POST"
          action="/api/auth/register-first-admin"
          className="mt-4 space-y-3 text-xs"
        >
          <div className="space-y-1">
            <label
              htmlFor="workspaceName"
              className="text-[11px] font-medium text-slate-200"
            >
              Workspace name
            </label>
            <input
              id="workspaceName"
              name="workspaceName"
              required
              defaultValue="Resourcin"
              className="block w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 outline-none ring-0 placeholder:text-slate-500 focus:border-[#FFC000] focus:ring-1 focus:ring-[#FFC000]"
              placeholder="Resourcin"
            />
          </div>

          <div className="space-y-1">
            <label
              htmlFor="fullName"
              className="text-[11px] font-medium text-slate-200"
            >
              Your name
            </label>
            <input
              id="fullName"
              name="fullName"
              required
              className="block w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 outline-none ring-0 placeholder:text-slate-500 focus:border-[#FFC000] focus:ring-1 focus:ring-[#FFC000]"
              placeholder="Victor Ephraim"
            />
          </div>

          <div className="space-y-1">
            <label
              htmlFor="email"
              className="text-[11px] font-medium text-slate-200"
            >
              Work email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="block w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 outline-none ring-0 placeholder:text-slate-500 focus:border-[#FFC000] focus:ring-1 focus:ring-[#FFC000]"
              placeholder="you@company.com"
            />
          </div>

          <div className="space-y-1">
            <label
              htmlFor="password"
              className="text-[11px] font-medium text-slate-200"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              className="block w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 outline-none ring-0 placeholder:text-slate-500 focus:border-[#FFC000] focus:ring-1 focus:ring-[#FFC000]"
              placeholder="At least 8 characters"
            />
          </div>

          <div className="space-y-1">
            <label
              htmlFor="confirmPassword"
              className="text-[11px] font-medium text-slate-200"
            >
              Confirm password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              minLength={8}
              className="block w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 outline-none ring-0 placeholder:text-slate-500 focus:border-[#FFC000] focus:ring-1 focus:ring-[#FFC000]"
            />
          </div>

          <button
            type="submit"
            className="mt-2 inline-flex w-full items-center justify-center rounded-full bg-[#FFC000] px-4 py-2 text-xs font-semibold text-slate-900 hover:bg-[#e6ae00]"
          >
            Create admin & continue
          </button>

          <p className="mt-2 text-[10px] text-slate-400">
            By continuing you&apos;ll create the first ThinkATS admin for this
            workspace.
          </p>
        </form>
      </div>
    </div>
  );
}
