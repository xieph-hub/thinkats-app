import ContactForm from "@/components/ContactForm";

export const metadata = {
  title: "Contact | Resourcin",
  description:
    "Get in touch with Resourcin about hiring, embedded HR support, or partnerships.",
};

export default function ContactPage() {
  return (
    <main className="bg-slate-50 min-h-screen">
      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#306B34]">
            Contact
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            Let&apos;s talk about your people and hiring roadmap.
          </h1>
          <p className="mt-3 text-sm text-slate-600 sm:text-base">
            Share a bit of context about where you are today and what you&apos;re
            trying to solve. We&apos;ll respond with a clear next step, not a
            generic deck.
          </p>
        </header>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <ContactForm />

          <aside className="space-y-4 rounded-2xl border border-slate-200 bg-slate-900/95 p-5 text-slate-100">
            <h2 className="text-sm font-semibold">Direct contact</h2>
            <p className="text-xs text-slate-300">
              Prefer to speak directly? You can also reach out via:
            </p>
            <ul className="mt-2 space-y-1 text-xs text-slate-200">
              <li>Phone / WhatsApp: +234 704 557 2393</li>
              <li>LinkedIn: @resourcin</li>
              <li>X / Twitter: @resourcinhq</li>
            </ul>
            <p className="mt-4 text-[11px] text-slate-400">
              Typical response time: under 24 business hours.
            </p>
          </aside>
        </div>
      </section>
    </main>
  );
}
