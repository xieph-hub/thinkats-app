
import Container from "@/components/Container";

export default function Page() {
  return (
    <section className="py-12 md:py-20">
      <Container>
        <h2 className="text-3xl font-bold">Find Your Next Role</h2>
        <p className="mt-2 text-slate-600 max-w-3xl">
          Explore thousands of curated job opportunities from leading organizations. Our intelligent platform connects you with roles
          that match your skills, aspirations, and values.
        </p>

        <div className="mt-6 grid md:grid-cols-3 gap-4">
          <a className="block rounded-2xl border border-slate-200 p-5 hover:shadow-soft transition" href="#jobs-search">
            <span className="font-medium">Search & Apply for Jobs</span>
            <p className="text-sm text-slate-600 mt-1">Filter by role, location, and seniority.</p>
          </a>
          <a className="block rounded-2xl border border-slate-200 p-5 hover:shadow-soft transition" href="#">
            <span className="font-medium">Create a Profile and Get Matched</span>
            <p className="text-sm text-slate-600 mt-1">Let opportunities come to you.</p>
          </a>
          <a className="block rounded-2xl border border-slate-200 p-5 hover:shadow-soft transition" href="/insights">
            <span className="font-medium">Access Expert Career Advice</span>
            <p className="text-sm text-slate-600 mt-1">Resume tips, interviews, and more.</p>
          </a>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <a href="#jobs-search" className="px-5 py-3 rounded-pill bg-brand-blue text-white shadow-soft">Start Your Search</a>
          <a href="/contact" className="px-5 py-3 rounded-pill border border-slate-300 hover:border-brand-blue">Join the Talent Network</a>
        </div>

        <div id="jobs-search" className="mt-10 bg-white border border-slate-200 rounded-2xl p-6">
          <div className="grid md:grid-cols-3 gap-3">
            <input className="rounded-xl border border-slate-300 px-4 py-2" placeholder="Job title e.g. Product Manager" />
            <input className="rounded-xl border border-slate-300 px-4 py-2" placeholder="Location e.g. Lagos / Remote" />
            <button className="rounded-pill bg-brand-green text-white px-4 py-2">Search</button>
          </div>
          <p className="text-xs text-slate-500 mt-3">
            TODO: Connect to your ATS API. Example endpoint scaffold available at <code>/api/jobs</code>.
          </p>
        </div>
      </Container>
    </section>
  );
}
