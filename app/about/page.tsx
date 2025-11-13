
import Container from "@/components/Container";

export default function Page() {
  return (
    <section className="py-12 md:py-20">
      <Container>
        <h2 className="text-3xl font-bold">Empowering Businesses. Elevating Careers.</h2>
        <p className="mt-3 text-slate-700">
          At Resourcin Human Capital Advisors Limited, we are a dynamic human capital solutions provider committed to connecting talent with opportunity.
          We specialize in customized recruitment, job placement, and HR advisory services leveraging advanced technology, strategic expertise, and deep industry insight
          to meet the evolving needs of both businesses and professionals. Our holistic approach streamlines the hiring process, enabling organizations to build
          high-performing teams while equipping individuals with the resources they need to advance their careers.
        </p>

        <div className="mt-8 grid md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200">
            <h3 className="font-semibold">Our Vision</h3>
            <p className="mt-2 text-slate-600">To be the leading human capital solutions provider, empowering businesses and individuals with transformative talent and career solutions that drive success.</p>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-slate-200">
            <h3 className="font-semibold">Our Mission</h3>
            <p className="mt-2 text-slate-600">To connect talent with opportunity—redefining workplaces and careers through innovation, expertise, and care.</p>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-slate-200">
            <h3 className="font-semibold">Our Values</h3>
            <ul className="mt-2 list-disc pl-6 text-slate-700 space-y-1">
              <li><span className="font-medium">Integrity:</span> Transparency, honesty, and ethical practice.</li>
              <li><span className="font-medium">Innovation:</span> Creativity and technology to connect people and opportunity.</li>
              <li><span className="font-medium">Excellence:</span> High standards and continuous improvement.</li>
              <li><span className="font-medium">Care:</span> People-first, every time.</li>
              <li><span className="font-medium">Partnership:</span> Success through collaboration.</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 grid lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200">
            <h3 className="font-semibold">Value Proposition</h3>
            <p className="mt-2 text-slate-700">
              Resourcin bridges the gap between talent and opportunity by providing tailored human capital solutions that empower both businesses and job seekers.
            </p>
            <ul className="mt-3 list-disc pl-6 text-slate-700 space-y-1">
              <li><span className="font-medium">For Businesses:</span> Build high-performing teams, foster thriving cultures, and scale with confidence through advanced talent acquisition and recruitment marketing solutions.</li>
              <li><span className="font-medium">For Job Seekers:</span> Curated opportunities, expert guidance, and tools to advance your career with confidence.</li>
            </ul>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-slate-200">
            <blockquote className="text-slate-700">“Resourcin helped us scale faster with the right people and clean HR operations—we could finally focus on the product.”</blockquote>
            <p className="mt-3 text-sm text-slate-500">— COO, SaaS</p>
          </div>
        </div>
      </Container>
    </section>
  );
}
