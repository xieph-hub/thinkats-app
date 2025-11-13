import Container from "@/components/Container";
import Image from "next/image";

export default function Page() {
  return (
    <section className="py-12 md:py-20 bg-white border-y">
      <Container>
        <h2 className="text-3xl font-bold">Services</h2>

        {/* Talent Acquisition */}
        <div className="mt-8 grid lg:grid-cols-2 gap-8 items-start">
          <div>
            <h3 className="text-2xl font-semibold">Talent Acquisition</h3>
            <p className="mt-2 text-slate-600">
              Build high-performing teams with precision. Our end-to-end talent acquisition solutions combine advanced technology,
              strategic HR insights, and personalized service to deliver the right people for every role.
            </p>
            <div className="mt-4 bg-brand-light border border-slate-200 rounded-2xl p-5">
              <p className="font-medium">What We Offer:</p>
              <ul className="mt-2 list-disc pl-6 text-slate-700 space-y-1">
                <li>Recruitment Process Outsourcing (RPO)</li>
                <li>Executive Search & Head Hunting</li>
                <li>Contract & Permanent Staffing</li>
                <li>Employer Branding & Recruitment Marketing</li>
              </ul>
            </div>
            <p className="mt-4 text-slate-600">
              <span className="font-medium">Our Edge:</span> We take a consultative approach, understanding your culture, goals,
              and workforce strategy to ensure every hire adds measurable value.
            </p>
          </div>

          <div className="relative rounded-2xl h-72 w-full overflow-hidden">
            <Image src="/services/ta.jpg" alt="Talent acquisition" fill className="object-cover" />
          </div>
        </div>

        {/* EOR */}
        <div className="mt-12 grid lg:grid-cols-2 gap-8 items-start">
          <div className="relative rounded-2xl h-72 w-full overflow-hidden order-last lg:order-first">
            <Image src="/services/eor.jpg" alt="Employer of Record" fill className="object-cover" />
          </div>

          <div>
            <h3 className="text-2xl font-semibold">Employer of Record (EOR)</h3>
            <p className="mt-2 text-slate-600">
              Expand seamlessly with confidence. Our Employer of Record services allow businesses to hire, onboard, and manage talent anywhere
              without the administrative burden of establishing a local entity.
            </p>
            <div className="mt-4 bg-brand-light border border-slate-200 rounded-2xl p-5">
              <p className="font-medium">Our EOR Solutions Include:</p>
              <ul className="mt-2 list-disc pl-6 text-slate-700 space-y-1">
                <li>Compliance & Payroll Management</li>
                <li>Onboarding & HR Administration</li>
                <li>Statutory Benefits & Tax Management</li>
                <li>Cross-border Employment Solutions</li>
                <li>Local Market Advisory</li>
              </ul>
            </div>
            <p className="mt-4 text-slate-600">
              <span className="font-medium">Why Resourcin EOR:</span> We simplify global hiring, reduce risk, and ensure compliance so you can focus on growth.
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}
