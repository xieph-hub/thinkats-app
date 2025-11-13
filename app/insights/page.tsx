import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";
import Container from "@/components/Container";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Connecting Talent with Opportunity — Redefining Workplaces and Careers",
  description:
    "At Resourcin Human Capital Advisors, we bridge the gap between talent and opportunity through tech-driven human capital solutions for employers and professionals.",
  alternates: { canonical: SITE_URL + "/" },
};

export default function Page() {
  return (
    <main>
      {/* Hero */}
      <section className="py-14 md:py-24 bg-white">
        <Container>
          <h1 className="text-3xl md:text-5xl font-bold leading-tight">
            Connecting Talent with Opportunity — Redefining Workplaces and Careers
          </h1>
          <p className="mt-4 text-slate-600 max-w-3xl">
            At Resourcin Human Capital Advisors, we bridge the gap between talent and opportunity through
            innovative, tech-driven human capital solutions. Whether you’re an employer building your dream team
            or a professional ready for the next step, we make your goals our mission.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/services"
              className="px-5 py-3 rounded-xl bg-[#172965] text-white hover:opacity-90"
            >
              Find Talent
            </Link>
            <Link
              href="/jobs"
              className="px-5 py-3 rounded-xl border border-slate-300 hover:bg-slate-50"
            >
              Find Jobs
            </Link>
          </div>

          <p className="mt-6 text-sm text-slate-500">
            Empowering organizations and professionals through data-driven talent solutions and human-centered expertise.
          </p>
        </Container>
      </section>

      {/* Two cards: Employers / Talent */}
      <section className="py-12 md:py-16 bg-slate-50 border-t">
        <Container>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-2xl bg-white p-6 border">
              <h2 className="text-xl font-semibold">For Employers</h2>
              <p className="mt-2 text-slate-600">
                Attract, hire, and retain top talent with scalable recruitment and HR solutions tailored to your business needs.
              </p>
              <Link href="/services" className="mt-4 inline-block text-[#172965] font-medium">
                Explore Services →
              </Link>
            </div>

            <div className="rounded-2xl bg-white p-6 border">
              <h2 className="text-xl font-semibold">For Talent</h2>
              <p className="mt-2 text-slate-600">
                Discover curated roles, expert insights, and career resources designed to help you thrive.
              </p>
              <Link href="/jobs" className="mt-4 inline-block text-[#172965] font-medium">
                Browse Jobs →
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
