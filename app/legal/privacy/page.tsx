// app/legal/privacy/page.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy notice | ThinkATS",
  description:
    "High-level placeholder privacy notice for the ThinkATS application.",
};

export default function PrivacyPage() {
  return (
    <main className="bg-slate-50">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Privacy notice
          </h1>
          <p className="mt-2 text-sm text-slate-700">
            This is a placeholder privacy notice for ThinkATS. Replace this
            content with your final legal wording when ready.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-4 text-xs text-slate-700">
          <p>
            ThinkATS processes candidate and hiring data on behalf of its
            tenants. Until you define a final privacy position, treat this as a
            development environment and avoid using production-level sensitive
            personal data.
          </p>
          <p>
            When you go live, you&apos;ll want to cover topics such as data
            retention, access controls, international transfers, and how
            candidates can exercise their data rights.
          </p>
        </div>
      </section>
    </main>
  );
}
