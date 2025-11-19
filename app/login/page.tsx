// app/login/page.tsx
import ClientLoginForm from "./ClientLoginForm";

export default function LoginPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <header className="mb-8">
        <p className="text-xs uppercase tracking-wide text-slate-500">
          Access portal
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900">
          Login
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Candidates use a secure email link. Client access lets you
          view pipelines, shortlist, and give structured feedback.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Candidate info card */}
        <section className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm">
          <h2 className="text-sm font-semibold text-slate-900">
            Candidates
          </h2>
          <p className="mt-2 text-xs text-slate-600">
            We&apos;re rolling out secure magic-link access for
            candidates. For now, applications and updates are handled
            via email and our internal team.
          </p>
        </section>

        {/* Client login */}
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">
            Client login
          </h2>
          <p className="mt-2 text-xs text-slate-600">
            Sign in with your Resourcin client credentials to access
            your ATS workspace.
          </p>

          <div className="mt-4">
            <ClientLoginForm />
          </div>
        </section>
      </div>
    </main>
  );
}
