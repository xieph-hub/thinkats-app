// app/contact/page.tsx
import type { Metadata } from "next";
import ContactForm from "./ContactForm";

export const metadata: Metadata = {
  title: "Contact | ThinkATS",
  description:
    "Talk to the ThinkATS team about applicant tracking, career sites, and hiring workflows.",
};

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-3xl bg-slate-900/80 border border-slate-800 rounded-2xl p-8 md:p-10 shadow-xl">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">
            Contact
          </p>
          <h1 className="mt-2 text-2xl md:text-3xl font-semibold text-slate-50">
            Tell us about your hiring stack.
          </h1>
          <p className="mt-3 text-sm text-slate-300 max-w-xl">
            Share a bit about your company, current tools, and what you&apos;d
            like ThinkATS to help you solve. We&apos;ll get back within one
            business day.
          </p>
        </div>

        {/* ✅ No event handlers here – just rendering the client form */}
        <ContactForm />
      </div>
    </main>
  );
}
