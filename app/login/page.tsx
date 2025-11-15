import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="max-w-3xl mx-auto py-16 px-4 space-y-8">
      <header className="space-y-3">
        <p className="text-xs uppercase tracking-[0.22em] text-neutral-500">
          Sign in
        </p>
        <h1 className="text-3xl font-semibold">
          Choose how you want to sign in
        </h1>
        <p className="text-sm text-neutral-400">
          Candidates manage their profiles and applications. Employers manage
          briefs, pipelines and EOR teams.
        </p>
      </header>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-neutral-800 bg-neutral-950/70 p-6 space-y-3">
          <h2 className="text-lg font-semibold">I&apos;m a candidate</h2>
          <p className="text-sm text-neutral-400">
            Sign in to view and update your profile, track applications and
            discover roles that match your preferences.
          </p>
          <p className="text-xs text-neutral-500">
            In the next phase this will link to the full candidate portal.
          </p>
        </div>

        <div className="rounded-2xl border border-neutral-800 bg-neutral-950/70 p-6 space-y-3">
          <h2 className="text-lg font-semibold">I&apos;m an employer</h2>
          <p className="text-sm text-neutral-400">
            Sign in to see live search pipelines, shortlisted candidates and
            EOR employees.
          </p>
          <p className="text-xs text-neutral-500">
            We&apos;ll connect this to the client portal dashboards as we build
            them out.
          </p>
        </div>
      </section>

      <p className="text-xs text-neutral-500">
        Need something urgent?{" "}
        <Link href="/contact" className="underline text-emerald-300">
          Contact the team
        </Link>
        .
      </p>
    </div>
  );
}
