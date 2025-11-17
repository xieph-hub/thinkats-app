// app/insights/page.tsx
import { getInsightsList } from "@/lib/insights";
import InsightsBrowser from "./InsightsBrowser";

export const revalidate = 60; // ISR – revalidate every 60s

export default async function InsightsPage() {
  const insights = await getInsightsList();

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <InsightsBrowser insights={insights} />
    </main>
  );
}
