// app/apply/success/page.tsx
import Container from "@/components/Container";
import Link from "next/link";

export default function Page({ searchParams }: { searchParams: { title?: string } }) {
  const title = searchParams.title ? decodeURIComponent(searchParams.title) : "the role";

  return (
    <section className="py-12 md:py-20">
      <Container>
        <h1 className="text-2xl font-bold">Application Received</h1>
        <p className="mt-3 text-slate-700">
          Thanks for applying to <span className="font-semibold">{title}</span>. We’ll review your application and get back to you.
        </p>
        <div className="mt-6 flex gap-3">
          <Link href="/jobs" className="px-5 py-3 rounded-xl border border-slate-300 hover:bg-slate-50">
            Back to Jobs
          </Link>
          <Link href="/insights" className="px-5 py-3 rounded-xl bg-[#172965] text-white hover:opacity-90">
            Read Career Insights
          </Link>
        </div>
      </Container>
    </section>
  );
}
