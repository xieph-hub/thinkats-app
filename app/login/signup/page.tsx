// app/signup/page.tsx
import type { Metadata } from "next";
import Container from "@/components/Container";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Start free trial | ThinkATS",
  description:
    "Create your ThinkATS workspace, invite your team and start running jobs and pipelines in minutes.",
};

export default function SignupPage() {
  return (
    <main className="bg-slate-50 py-12 md:py-16">
      <Container>
        <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-xl font-semibold text-slate-900">
            Start your ThinkATS trial
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Create a workspace for your agency or HR team. No credit card
            required. You can upgrade or cancel at any time.
          </p>

          <form className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="md:col-span-1">
              <label
                htmlFor="fullName"
                className="block text-xs font-medium text-slate-700"
              >
                Your name
              </label>
              <input
                id="fullName"
                name="fullName"
                required
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-[#1E40AF] focus:outline-none focus:ring-1 focus:ring-[#1E40AF]"
              />
            </div>
            <div className="md:col-span-1">
              <label
                htmlFor="email"
                className="block text-xs font-medium text-slate-700"
              >
                Work email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-[#1E40AF] focus:outline-none focus:ring-1 focus:ring-[#1E40AF]"
              />
            </div>
            <div className="md:col-span-1">
              <label
                htmlFor="company"
                className="block text-xs font-medium text-slate-700"
              >
                Company / firm name
              </label>
              <input
                id="company"
                name="company"
                required
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-[#1E40AF] focus:outline-none focus:ring-1 focus:ring-[#1E40AF]"
              />
            </div>
            <div className="md:col-span-1">
              <label
                htmlFor="teamSize"
                className="block text-xs font-medium text-slate-700"
              >
                Team size
              </label>
              <select
                id="teamSize"
                name="teamSize"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-[#1E40AF] focus:outline-none focus:ring-1 focus:ring-[#1E40AF]"
              >
                <option value="1-5">1–5 recruiters</option>
                <option value="6-15">6–15 recruiters</option>
                <option value="16-50">16–50 recruiters</option>
                <option value="51+">51+ recruiters</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label
                htmlFor="subdomain"
                className="block text-xs font-medium text-slate-700"
              >
                Preferred workspace subdomain
              </label>
              <div className="mt-1 flex items-center gap-2">
                <input
                  id="subdomain"
                  name="subdomain"
                  placeholder="yourfirm"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-[#1E40AF] focus:outline-none focus:ring-1 focus:ring-[#1E40AF]"
                />
                <span className="text-xs text-slate-500">
                  .thinkats.com
                </span>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                You&apos;ll be able to adjust this during onboarding.
              </p>
            </div>

            <div className="md:col-span-2">
              <label className="flex items-start gap-2 text-[11px] text-slate-600">
                <input
                  type="checkbox"
                  className="mt-[2px] h-3.5 w-3.5 rounded border-slate-300 text-[#1E40AF] focus:ring-[#1E40AF]"
                  required
                />
                <span>
                  I agree to the{" "}
                  <Link
                    href="/legal/terms"
                    className="font-semibold text-[#1E40AF] hover:underline"
                  >
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="/legal/privacy"
                    className="font-semibold text-[#1E40AF] hover:underline"
                  >
                    Privacy Policy
                  </Link>
                  .
                </span>
              </label>
            </div>

            <div className="md:col-span-2">
              <button
                type="submit"
                className="w-full rounded-lg bg-[#1E40AF] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#1D4ED8]"
              >
                Create workspace
              </button>
            </div>
          </form>

          <p className="mt-4 text-xs text-slate-600">
            Already have a ThinkATS workspace?{" "}
            <Link
              href="/login"
              className="font-semibold text-[#1E40AF] hover:underline"
            >
              Sign in
            </Link>
            .
          </p>
        </div>
      </Container>
    </main>
  );
}
