
import Container from "@/components/Container";
import Link from "next/link";
import { getAllPosts } from "@/lib/insights";

export const dynamic = "force-static";

export default function Page() {
  const posts = getAllPosts();
  return (
    <section className="py-12 md:py-20 bg-white border-y">
      <Container>
        <h2 className="text-3xl font-bold">Stay Ahead with Expert Insights</h2>
        <p className="mt-2 text-slate-600 max-w-3xl">
          Access research, thought leadership, and HR trends shaping the future of work. From talent management strategies to workplace innovation,
          our insights help employers and professionals make informed decisions in a rapidly evolving market.
        </p>

        <div className="mt-8 grid md:grid-cols-3 gap-6">
          {posts.map(p => (
            <Link key={p.slug} href={`/insights/${p.slug}`} className="rounded-2xl border border-slate-200 p-5 hover:shadow-soft transition block">
              <p className="text-xs text-slate-500">{p.category ?? "Insight"}{p.date ? ` • ${new Date(p.date).toLocaleDateString()}` : ""}</p>
              <h3 className="font-semibold mt-1">{p.title}</h3>
              <p className="text-sm text-slate-600 mt-2">{p.excerpt}</p>
            </Link>
          ))}
        </div>

        <div className="mt-6 flex gap-3">
          <a href="/insights" className="inline-flex items-center gap-2 px-4 py-2 rounded-pill bg-brand-blue text-white shadow-soft">
            Read Our Latest Articles
          </a>
        </div>
      </Container>
    </section>
  );
}
