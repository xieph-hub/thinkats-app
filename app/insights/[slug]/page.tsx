
import Container from "@/components/Container";
import { getAllPosts, getPost } from "@/lib/insights";
import { notFound } from "next/navigation";

export const dynamic = "force-static";

export function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map(p => ({ slug: p.slug }));
}

export default function Page({ params }: { params: { slug: string }}) {
  const post = getPost(params.slug);
  if (!post) return notFound();
  const { frontmatter, content } = post;
  const date = frontmatter?.date ? new Date(frontmatter.date).toLocaleDateString() : null;

  return (
    <section className="py-12 md:py-20">
      <Container>
        <p className="text-sm text-slate-500">{frontmatter?.category ?? "Insight"}{date ? ` • ${date}` : ""}</p>
        <h1 className="text-3xl font-bold mt-2">{frontmatter?.title ?? params.slug}</h1>
        <article className="prose prose-slate mt-6 max-w-none whitespace-pre-wrap">
          {content}
        </article>
      </Container>
    </section>
  );
}
