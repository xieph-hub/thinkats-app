import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";
import Container from "@/components/Container";

export const metadata: Metadata = {
  title: "About — Empowering Businesses. Elevating Careers.",
  description:
    "Resourcin Human Capital Advisors connects talent with opportunity through customized recruitment, job placement, and HR advisory—powered by technology and deep industry insight.",
  alternates: { canonical: SITE_URL + "/about" },
};

export default function Page() {
  return (
    <main>
      <section className="py-14 md:py-20 bg-white">
        <Container>
          <h1 className="text-3xl md:text-5xl font-bold">Empowering Businesses. Elevating Careers.</h1>
          <p className="mt-4 text-slate-600 max-w-3xl">
            We are a dynamic human capital solutions provider committed to connecting talent with opportunity.
            Our holistic approach streamlines hiring for organizations and equips individuals with the tools to
            advance their careers.
          </p>

          <div className="mt-10 grid md:grid-cols-2 gap-6">
            <div className="rounded-2xl border p-6">
              <h2 className="text-xl font-semibold">Our Vision</h2>
              <p className="mt-2 text-slate-600">
                To be the leading human capital solutions provider, empowering businesses and individuals with
                transformative talent and career solutions that drive success.
              </p>
            </div>
            <div className="rounded-2xl border p-6">
              <h2 className="text-xl font-semibold">Our Mission</h2>
              <p className="mt-2 text-slate-600">
                To connect talent with opportunity—redefining workplaces and careers through innovation, expertise,
                and care.
              </p>
            </div>
          </div>

          <div className="mt-6 grid md:grid-cols-3 gap-6">
            <div className="rounded-2xl border p-6">
              <h3 className="font-medium">Integrity</h3>
              <p className="mt-2 text-slate-600 text-sm">
                Transparency, honesty, and ethical practices in all that we do.
              </p>
            </div>
            <div className="rounded-2xl border p-6">
              <h3 className="font-medium">Innovation</h3>
              <p className="mt-2 text-slate-600 text-sm">
                Creativity and technology to pioneer new ways of connecting people and opportunity.
              </p>
            </div>
            <div className="rounded-2xl border p-6">
              <h3 className="font-medium">Excellence</h3>
              <p className="mt-2 text-slate-600 text-sm">
                Continually improving to exceed expectations.
              </p>
            </div>
            <div className="rounded-2xl border p-6">
              <h3 className="font-medium">Care</h3>
              <p className="mt-2 text-slate-600 text-sm">
                People-first experiences where every client and candidate feels valued, heard, and supported.
              </p>
            </div>
            <div className="rounded-2xl border p-6">
              <h3 className="font-medium">Partnership</h3>
              <p className="mt-2 text-slate-600 text-sm">
                Success is collaborative—we work hand-in-hand to achieve shared goals.
              </p>
            </div>
          </div>

          <div className="mt-10 rounded-2xl border p-6 bg-slate-50">
            <h2 className="text-xl font-semibold">Value Proposition</h2>
            <p className="mt-2 text-slate-600">
              Resourcin bridges the gap between talent and opportunity with tailored solutions that empower both
              businesses and job seekers.
            </p>
            <ul className="mt-4 list-disc pl-5 text-slate-700 space-y-1">
              <li>
                <span className="font-medium">For Businesses:</span> build high-performing teams, foster thriving
                workplace cultures, and scale with confidence through advanced talent acquisition and recruitment
                marketing.
              </li>
              <li>
                <span className="font-medium">For Job Seekers:</span> curated opportunities, expert guidance, and
                tools to advance your career with confidence.
              </li>
            </ul>
          </div>
        </Container>
      </section>
    </main>
  );
}
