import Container from "@/components/Container";
import Image from "next/image";

export default function Page() {
  return (
    <section className="py-12 md:py-20">
      <Container>
        <h2 className="text-3xl font-bold">Empowering Businesses. Elevating Careers.</h2>
        <p className="mt-3 text-slate-700">
          At Resourcin Human Capital Advisors Limited, we are a dynamic human capital solutions provider committed to connecting talent with opportunity...
        </p>

        <div className="mt-8 grid md:grid-cols-3 gap-6">
          {/* ... your existing cards ... */}
        </div>

        <div className="mt-8 grid lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200">
            {/* ... value proposition text ... */}
          </div>

          <div className="relative rounded-2xl h-72 w-full overflow-hidden">
            <Image src="/about/team.jpg" alt="Resourcin team" fill className="object-cover" />
          </div>
        </div>
      </Container>
    </section>
  );
}
