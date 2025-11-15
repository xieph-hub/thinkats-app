// app/admin/sourcing/page.tsx
import { prisma } from "@/lib/prisma";
import SourcingForm from "./SourcingForm";
import { createSourcedCandidate } from "./actions";

export const runtime = "nodejs";

export default async function SourcingPage() {
  // Fetch jobs for the dropdown (optional association)
  const jobs = await prisma.job.findMany({
    select: { id: true, title: true },
    orderBy: { title: "asc" },
  });

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 px-4 py-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            Sourcing workspace
          </h1>
          <p className="text-sm text-slate-400 max-w-2xl">
            Paste LinkedIn profiles, CVs, or notes, let the system{" "}
            <span className="font-medium text-slate-200">
              auto-fill key fields
            </span>
            , then save candidates into your Resourcin pipeline.
          </p>
        </header>

        <SourcingForm jobs={jobs} createSourcedCandidate={createSourcedCandidate} />
      </div>
    </main>
  );
}
