// app/register/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Create admin | ThinkATS",
};

export default async function RegisterPage({
  searchParams,
}: {
  searchParams?: { error?: string };
}) {
  const error = searchParams?.error;
  const userCount = await prisma.user.count();
  const disabled = userCount > 0;

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">
          Create first admin
        </h1>
        <p className="mt-1 text-xs text-slate-600">
          This screen is only for bootstrapping your ThinkATS workspace.
          Once an admin exists, registration is disabled.
        </p>

        {error && (
          <p className="mt-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] text-rose-700">
            {decodeURIComponent(error)}
          </p>
        )}

        {disabled ? (
          <div className="mt-4 rounded-md bg-slate-50 px-3 py-2 text-[11px] text-slate-600">
            An account already exists.{" "}
            <Link
              href="/login"
              className="font-medium text-[#172965] hover:underline"
            >
              Go to login
            </Link>
            .
          </div>
        ) : (
          <form
            method="POST"
            action="/api/auth/register"
            className="mt-4 space-y-3 text-[13px]"
          >
            <div className="space-y-1">
              <label
                htmlFor="fullName"
                className="text-xs font-medium text-slate-700"
              >
                Full name
              </label>
              <input
                id="fullName"
                name="fullName"
                placeholder="Victor Ephraim"
                className="block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="email"
                className="text-xs font-medium text-slate-700"
              >
                Work email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="you@resourcin.com"
                className="block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="password"
                className="text-xs font-medium text-slate-700"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={8}
                className="block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
              />
              <p className="mt-1 text-[10px] text-slate-500">
                Use a strong password; this account will be SUPER_ADMIN.
              </p>
            </div>

            <button
              type="submit"
              className="mt-2 inline-flex w-full items-center justify-center rounded-full bg-[#172965] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#0f1c48]"
            >
              Create admin
            </button>

            <p className="mt-2 text-center text-[11px] text-slate-500">
              Already set this up?{" "}
              <Link
                href="/login"
                className="font-medium text-[#172965] hover:underline"
              >
                Go to login
              </Link>
              .
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
