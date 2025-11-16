// app/login/page.tsx
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Login | Resourcin",
  description:
    "Sign in as a candidate or client to access your Resourcin workspace.",
};

type LoginPageProps = {
  searchParams?: {
    view?: string;
  };
};

export default function LoginPage({ searchParams }: LoginPageProps) {
  const view = searchParams?.view === "client" ? "client" : "candidate";

  const isCandidate = view === "candidate";
  const isClient = view === "client";

  return (
    <div className="bg-slate-50 min-h-screen">
      <main className="mx-auto flex max-w-4xl flex-col px-4 py-10 sm:px-6 lg:px-8">
        {/* Header */}
        <section className="mb-8 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#306B34]">
            Login
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                Sign in to Resourcin
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-600">
                Candidates see their applications and profile. Clients see roles,
                pipelines, and updates. Choose how you’re signing in below.
              </p>
            </div>
            <div className="mt-3 flex flex-col items-start text-[11px] text-slate-500 sm:items-end">
              <span>Need to share a new hiring brief?</span>
              <Link
                href="/request-talent"
                className="mt-1 inline-flex items-center rounded-full border border-[#172965] bg-white px-3 py-1.5 text-xs font-semibold text-[#172965] shadow-sm hover:bg-[#172965] hover:text-white"
              >
                Request talent
                <span className="ml-1 text-sm" aria-hidden="true">
                  →
                </span>
              </Link>
            </div>
          </div>
        </section>

        {/* Toggle */}
        <section className="mb-5 rounded-3xl border border-slate-100 bg-white/95 p-2 shadow-sm ring-1 ring-slate-100/60">
          <div className="flex gap-1 rounded-2xl bg-slate-50 p-1 text-xs font-medium text-slate-600">
            <Link
              href="/login?view=candidate"
              className={`flex-1 rounded-2xl px-3 py-2 text-center transition ${
                isCandidate
                  ? "bg-white text-[#172965] shadow-sm"
                  : "hover:bg-slate-100"
              }`}
            >
              Candidate
            </Link>
            <Link
              href="/login?view=client"
              className={`flex-1 rounded-2xl px-3 py-2 text-center transition ${
                isClient
                  ? "bg-white text-[#172965] shadow-sm"
                  : "hover:bg-slate-100"
              }`}
            >
              Client
            </Link>
          </div>
        </section>

        {/* Panels */}
        <section className="grid gap-5 md:grid-cols-[minmax(0,3fr),minmax(0,2fr)]">
          {/* Form panel */}
          <div className="rounded-3xl border border-slate-100 bg-white/95 p-5 shadow-sm ring-1 ring-slate-100/60">
            {isCandidate ? (
              <>
                <h2 className="text-sm font-semibold text-slate-900">
                  Candidate login
                </h2>
                <p className="mt-1 text-[13px] leading-relaxed text-slate-600">
                  Access your applications, interview updates, and talent
                  profile. Use the same email you applied with.
                </p>
              </>
            ) : (
              <>
                <h2 className="text-sm font-semibold text-slate-900">
                  Client login
                </h2>
                <p className="mt-1 text-[13px] leading-relaxed text-slate-600">
                  View open roles, pipelines, and hiring progress. Use your
                  work email associated with your Resourcin workspace.
                </p>
              </>
            )}

            <form className="mt-4 space-y-3">
              <div className="space-y-1.5 text-xs">
                <label
                  htmlFor="email"
                  className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500"
                >
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="block w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
                  placeholder={
                    isCandidate
                      ? "you@personal-email.com"
                      : "you@company.com"
                  }
                />
              </div>

              <div className="space-y-1.5 text-xs">
                <label
                  htmlFor="password"
                  className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500"
                >
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="block w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
                  placeholder="••••••••"
                />
              </div>

              <div className="flex items-center justify-between pt-1 text-[11px]">
                <label className="inline-flex items-center gap-2 text-slate-600">
                  <input
                    type="checkbox"
                    className="h-3 w-3 rounded border-slate-300 text-[#172965] focus:ring-[#172965]"
                  />
                  <span>Keep me signed in</span>
                </label>
                <button
                  type="button"
                  className="text-[#172965] hover:text-[#0f1b45]"
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="button"
                className="mt-2 inline-flex w-full items-center justify-center rounded-2xl bg-[#172965] px-3 py-2 text-xs font-semibold text-slate-50 shadow-sm hover:bg-[#101a45]"
              >
                Continue
              </button>

              <div className="relative py-2 text-center text-[11px] text-slate-400">
                <span className="absolute inset-x-0 top-1/2 -z-10 h-px bg-slate-100" />
                <span className="relative bg-white px-2">or</span>
              </div>

              <button
                type="button"
                className="inline-flex w-full items-center justify-center rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
              >
                Continue with LinkedIn (placeholder)
              </button>
            </form>

            <div className="mt-4 border-t border-slate-100 pt-3 text-[11px] text-slate-600">
              {isCandidate ? (
                <p>
                  New here?{" "}
                  <Link
                    href="/talent-network"
                    className="font-semibold text-[#172965] hover:text-[#0f1b45]"
                  >
                    Join the talent network
                  </Link>{" "}
                  to share your profile.
                </p>
              ) : (
                <p>
                  Don’t have access yet?{" "}
                  <Link
                    href="/request-talent"
                    className="font-semibold text-[#172965] hover:text-[#0f1b45]"
                  >
                    Request a client workspace
                  </Link>{" "}
                  and we’ll onboard your team.
                </p>
              )}
            </div>
          </div>

          {/* Side panel */}
          <aside className="flex flex-col justify-between gap-4 rounded-3xl border border-slate-100 bg-[#172965] px-4 py-5 text-slate-50 shadow-sm">
            <div className="space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#64C247]">
                What you get
              </p>
              {isCandidate ? (
                <>
                  <h2 className="text-sm font-semibold">
                    Keep your career story in one place.
                  </h2>
                  <ul className="mt-2 space-y-1.5 text-[11px] text-slate-100/90">
                    <li className="flex gap-2">
                      <span className="mt-[5px] h-1.5 w-1.5 rounded-full bg-[#64C247]" />
                      <span>Track applications and interview steps.</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="mt-[5px] h-1.5 w-1.5 rounded-full bg-[#64C247]" />
                      <span>Update your profile as your skills grow.</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="mt-[5px] h-1.5 w-1.5 rounded-full bg-[#64C247]" />
                      <span>Stay in view for roles that actually fit.</span>
                    </li>
                  </ul>
                </>
              ) : (
                <>
                  <h2 className="text-sm font-semibold">
                    A clear window into your hiring work.
                  </h2>
                  <ul className="mt-2 space-y-1.5 text-[11px] text-slate-100/90">
                    <li className="flex gap-2">
                      <span className="mt-[5px] h-1.5 w-1.5 rounded-full bg-[#64C247]" />
                      <span>See roles, pipelines, and weekly progress.</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="mt-[5px] h-1.5 w-1.5 rounded-full bg-[#64C247]" />
                      <span>Collaborate with Resourcin and your team.</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="mt-[5px] h-1.5 w-1.5 rounded-full bg-[#64C247]" />
                      <span>Keep decisions and context in one place.</span>
                    </li>
                  </ul>
                </>
              )}
            </div>

            <div className="space-y-2 rounded-2xl bg-slate-900/40 p-3 text-[11px]">
              <p className="font-semibold text-slate-50">
                Having trouble signing in?
              </p>
              <p className="text-slate-200">
                Drop us a quick note and we’ll help you get back in.
              </p>
              <Link
                href="/contact"
                className="inline-flex items-center font-semibold text-[#64C247] hover:text-[#7be15c]"
              >
                Contact support
                <span className="ml-1 text-sm" aria-hidden="true">
                  →
                </span>
              </Link>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}
