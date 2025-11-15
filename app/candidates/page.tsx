import Link from "next/link";

export default function CandidatesPage() {
  return (
    <div className="max-w-5xl mx-auto py-16 px-4 space-y-8">
      <header className="space-y-3">
        <p className="text-xs uppercase tracking-[0.22em] text-neutral-500">
          For Candidates
        </p>
        <h1 className="text-3xl font-semibold">
          Find roles and join our African talent network
        </h1>
        <p className="text-sm text-neutral-400 max-w-2xl">
          Whether you&apos;re a graduate, mid-level professional or senior
          executive, Resourcin connects you with employers across Africa and
          beyond.
        </p>
      </header>

      <section className="grid gap-6 md:grid-cols-2">
        <Link
          href="/jobs"
          className="group rounded-2xl border border-neutral-800 bg-neutral-950/70 p-6 hover:border-emerald-400/70 hover:bg-neutral-900 transition"
        >
          <h2 className="text-lg font-semibold mb-2">Browse open roles</h2>
          <p className="text-sm text-neutral-400 mb-4">
            Search curated roles from our client companies: graduate programmes,
            mid-level roles and leadership positions.
          </p>
          <span className="text-xs font-medium text-emerald-300 group-hover:underline">
            Go to job board →
          </span>
        </Link>

        <Link
          href="/talent-network"
          className="group rounded-2xl border border-neutral-800 bg-neutral-950/70 p-6 hover:border-emerald-400/70 hover:bg-neutral-900 transition"
        >
          <h2 className="text-lg font-semibold mb-2">
            Join the talent network
          </h2>
          <p className="text-sm text-neutral-400 mb-4">
            Share your profile once and stay on our radar for future roles that
            match your skills, interests and salary expectations.
          </p>
          <span className="text-xs font-medium text-emerald-300 group-hover:underline">
            Join the network →
          </span>
        </Link>
      </section>
    </div>
  );
}
