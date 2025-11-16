export default function LoginPage() {
  return (
    <main className="py-16">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-semibold text-slate-900 mb-4">
          Login
        </h1>
        <p className="text-slate-600 mb-6 text-sm">
          This will become the entry point for{" "}
          <span className="font-medium">candidate</span> and{" "}
          <span className="font-medium">client</span> portals.
        </p>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">
            For now, this is a placeholder. When we&apos;re ready, we&apos;ll
            integrate authentication (Supabase Auth or similar) and separate
            candidate vs client dashboards.
          </p>
        </div>
      </div>
    </main>
  );
}
