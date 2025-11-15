import { prisma } from "@/lib/prisma";
import SourcingClient from "./SourcingClient";

export const runtime = "nodejs";

export default async function SourcingPage() {
  const candidates = await prisma.candidate.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const simplified = candidates.map((c) => ({
    id: c.id,
    fullname: c.fullname,
    email: c.email,
    phone: c.phone,
    location: c.location,
    source: c.source,
    createdAt: c.createdAt.toISOString(),
  }));

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <header className="mb-6 flex flex-col gap-2">
          <h1 className="text-2xl font-semibold text-slate-900">
            Talent sourcing
          </h1>
          <p className="text-sm text-slate-500 max-w-2xl">
            Paste LinkedIn profiles or CVs, let AI pre-fill key fields, then
            save candidates into your Resourcin pipeline.
          </p>
        </header>

        <SourcingClient initialCandidates={simplified} />
      </div>
    </div>
  );
}
