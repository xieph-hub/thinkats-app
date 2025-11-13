import Container from "@/components/Container";
import Image from "next/image";

export default function Page() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-brand-light via-white to-brand-green/10" />
      <Container className="pt-14 pb-20 grid md:grid-cols-2 gap-10 items-center">
        <div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
            Connecting Talent with Opportunity — Redefining Workplaces and Careers
          </h1>
          <p className="mt-4 text-lg text-slate-600">
            At Resourcin Human Capital Advisors, we bridge the gap between talent and opportunity through innovative, tech-driven human capital solutions.
            Whether you’re an employer building your dream team or a professional ready for the next step, we make your goals our mission.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href="/services" className="px-5 py-3 rounded-pill bg-brand-blue text-white shadow-soft">Find Talent</a>
            <a href="/jobs" className="px-5 py-3 rounded-pill border border-slate-300 hover:border-brand-blue">Find Jobs</a>
          </div>
          <div className="mt-8 grid md:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl p-6 border border-slate-200">
              <p className="font-semibold">For Employers</p>
              <p className="text-sm text-slate-600 mt-1">
                Attract, hire, and retain top talent with scalable recruitment and HR solutions tailored to your business needs.
              </p>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-slate-200">
              <p className="font-semibold">For Talent</p>
              <p className="text-sm text-slate-600 mt-1">
                Discover curated job opportunities, expert insights, and career resources designed to help you thrive.
              </p>
            </div>
          </div>
          <p className="mt-6 text-sm text-slate-600">Empowering organizations and professionals through data-driven talent solutions and human-centered expertise.</p>
        </div>

        <div className="relative w-full h-80 md:h-[28rem] overflow-hidden rounded-2xl shadow-soft">
          <Image src="/hero.jpg" alt="Connecting talent with opportunity" fill className="object-cover" priority />
        </div>
      </Container>
    </section>
  );
}
