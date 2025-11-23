// app/jobs/[jobIdOrSlug]/page.tsx

type PageProps = {
  params: { jobIdOrSlug: string };
};

export default function JobDebugPage({ params }: PageProps) {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-xl font-semibold mb-4">Job debug page</h1>
      <p className="text-sm text-slate-700">
        This is the dynamic job route. If you see this, routing is working.
      </p>
      <pre className="mt-4 rounded bg-slate-100 p-3 text-xs">
        {JSON.stringify(params, null, 2)}
      </pre>
    </main>
  );
}
