import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";
import Container from "@/components/Container";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Contact — Let’s Connect",
  description:
    "Whether you’re an employer seeking top talent or a professional exploring your next opportunity, we’re here to help.",
  alternates: { canonical: SITE_URL + "/contact" },
};

export default function Page() {
  return (
    <main>
      <section className="py-14 md:py-20 bg-white">
        <Container>
          <h1 className="text-3xl md:text-5xl font-bold">Let’s Connect</h1>
          <p className="mt-4 text-slate-600 max-w-3xl">
            Whether you’re an employer looking for top talent or a professional seeking your next big opportunity,
            we’re here to help.
          </p>

          <div className="mt-8 grid md:grid-cols-2 gap-6">
            {/* Contact card */}
            <div className="rounded-2xl border p-6">
              <h2 className="text-xl font-semibold">Contact Details</h2>
              <ul className="mt-3 space-y-2 text-slate-700">
                <li>
                  <a href="mailto:hello@resourcin.com" className="text-[#172965] font-medium">
                    hello@resourcin.com
                  </a>
                </li>
                <li>
                  <a href="tel:+2347045582393" className="text-[#172965] font-medium">
                    +234 704 558 2393
                  </a>
                </li>
              </ul>

              <div className="mt-6">
                <h3 className="font-medium">Social</h3>
                <div className="mt-2 flex items-center gap-3 text-sm">
                  <Link href="https://www.linkedin.com/company/resourcin" target="_blank" rel="noopener noreferrer" className="text-slate-700 hover:text-[#172965]">
                    LinkedIn
                  </Link>
                  <span className="text-slate-400">•</span>
                  <Link href="https://x.com/resourcinhq" target="_blank" rel="noopener noreferrer" className="text-slate-700 hover:text-[#172965]">
                    X (Twitter)
                  </Link>
                  <span className="text-slate-400">•</span>
                  <Link href="https://www.instagram.com/resourcinhq/" target="_blank" rel="noopener noreferrer" className="text-slate-700 hover:text-[#172965]">
                    Instagram
                  </Link>
                </div>
              </div>
            </div>

            {/* Simple form stub (non-functional placeholder) */}
            <div className="rounded-2xl border p-6">
              <h2 className="text-xl font-semibold">Send Us a Message</h2>
              <p className="mt-2 text-slate-600 text-sm">
                We’ll route your inquiry to the right team. (Submission handling will be wired later.)
              </p>

              <form className="mt-4 grid gap-3">
                <input className="border rounded-xl p-3" placeholder="Full Name" />
                <input className="border rounded-xl p-3" placeholder="Work Email" type="email" />
                <input className="border rounded-xl p-3" placeholder="Company (optional)" />
                <textarea className="border rounded-xl p-3 min-h-[120px]" placeholder="How can we help?" />
                <button
                  type="button"
                  className="px-5 py-3 rounded-xl bg-[#172965] text-white hover:opacity-90"
                  title="This is a static placeholder; we’ll wire form handling next."
                >
                  Request a Consultation
                </button>
              </form>
            </div>
          </div>

          <p className="mt-8 text-sm text-slate-500">
            Together, let’s build the future of work.
          </p>
        </Container>
      </section>
    </main>
  );
}
