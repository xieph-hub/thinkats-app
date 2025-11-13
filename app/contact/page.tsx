
import Container from "@/components/Container";

export default function Page() {
  return (
    <section className="py-12 md:py-20 bg-white border-y">
      <Container className="grid md:grid-cols-2 gap-10">
        <div>
          <h2 className="text-3xl font-bold">Let’s Connect</h2>
          <p className="mt-2 text-slate-600 max-w-2xl">
            Whether you’re an employer looking for top talent or a professional seeking your next big opportunity, we’re here to help.
          </p>
          <dl className="mt-6 space-y-2 text-slate-700">
            <div><dt className="font-medium inline">Email:</dt> <dd className="inline"><a className="text-brand-blue underline" href="mailto:hello@resourcin.com">hello@resourcin.com</a></dd></div>
            <div><dt className="font-medium inline">Phone:</dt> <dd className="inline"><a className="text-brand-blue underline" href="tel:+2347045582393">+234 704 558 2393</a></dd></div>
            <div><dt className="font-medium inline">LinkedIn:</dt> <dd className="inline"><a className="text-brand-blue underline" href="https://www.linkedin.com/company/resourcin" target="_blank">linkedin.com/company/resourcin</a></dd></div>
            <div><dt className="font-medium inline">X:</dt> <dd className="inline"><a className="text-brand-blue underline" href="https://x.com/resourcinhq" target="_blank">x.com/resourcinhq</a></dd></div>
            <div><dt className="font-medium inline">Instagram:</dt> <dd className="inline"><a className="text-brand-blue underline" href="https://www.instagram.com/resourcinhq/" target="_blank">instagram.com/resourcinhq</a></dd></div>
          </dl>
          <p className="mt-6 text-sm text-slate-600">Together, let’s build the future of work.</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h3 className="font-semibold">Send Us a Message</h3>
          <form className="mt-4 space-y-3" action="https://formspree.io/f/your-id" method="POST">
            <input name="name" className="w-full rounded-xl border border-slate-300 px-4 py-2" placeholder="Your name" required />
            <input name="email" type="email" className="w-full rounded-xl border border-slate-300 px-4 py-2" placeholder="Email" required />
            <textarea name="message" rows={4} className="w-full rounded-xl border border-slate-300 px-4 py-2" placeholder="How can we help?" required></textarea>
            <div className="flex flex-wrap gap-3">
              <button type="submit" className="px-5 py-2.5 rounded-pill bg-brand-blue text-white hover:opacity-90 shadow-soft">Send Us a Message</button>
              <a href="/services" className="px-5 py-2.5 rounded-pill border border-slate-300 hover:border-brand-blue">Request a Consultation</a>
            </div>
          </form>
          <p className="mt-3 text-xs text-slate-500">Replace the form action with your Formspree (or similar) endpoint.</p>
        </div>
      </Container>
    </section>
  );
}
