// app/debug/host/page.tsx
import { getHostContext } from "@/lib/host";

export const dynamic = "force-dynamic";

export default async function DebugHostPage() {
  const ctx = await getHostContext();

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 p-6">
      <div className="mx-auto max-w-3xl space-y-4">
        <h1 className="text-lg font-semibold">Host debug</h1>
        <p className="text-xs text-slate-400">
          Raw output of <code className="rounded bg-slate-900 px-1 py-0.5">getHostContext()</code>{" "}
          for this request.
        </p>
        <pre className="whitespace-pre-wrap rounded-lg border border-slate-800 bg-slate-900 p-4 text-[11px] leading-snug text-slate-100">
{JSON.stringify(ctx, null, 2)}
        </pre>
      </div>
    </main>
  );
}
