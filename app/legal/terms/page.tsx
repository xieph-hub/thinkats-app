// app/legal/terms/page.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of use | ThinkATS",
  description:
    "High-level placeholder terms of use for the ThinkATS application.",
};

export default function TermsPage() {
  return (
    <main className="bg-slate-50">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Terms of use
          </h1>
          <p className="mt-2 text-sm text-slate-700">
            These are placeholder terms for ThinkATS. Replace this copy with
            your final legal wording when you&apos;re ready.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-4 text-xs text-slate-700">
          <p>
            ThinkATS is currently in active development. Any access you grant to
            clients or colleagues should be considered early access and may be
            subject to change, including features, behaviour and availability.
          </p>
          <p>
            Do not paste any highly sensitive personal data or regulated
            information into the system while you are still shaping final terms
            with your legal and compliance partners.
          </p>
        </div>
      </section>
    </main>
  );
}
