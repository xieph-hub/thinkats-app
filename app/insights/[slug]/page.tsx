import Container from "@/components/Container";
import Image from "next/image";
import { getAllPosts, getPost } from "@/lib/insights";
import { notFound } from "next/navigation";
import { marked } from "marked";

export const dynamic = "force-static";

export function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((p) => ({ slug: p.slug }));
}

export default function Page({ params }: { params: { slug: string } }) {
  const post = getPost(params.slug);
  if (!post) return notFound();
  const { frontmatter, content } = post;

  const date = frontmatter?.date ? new Date(frontmatter.date).toLocaleDateString() : null;
  const cover = typeof frontmatter?.cover === "string" ? frontmatter.cover : undefined;

  // Convert Markdown -> HTML
  const html = marked.parse(content ?? "");

  return (
    <section className="py-12 md:py-20">
      <Container>
        <p className="text-sm text-slate-500">
          {frontmatter?.category ?? "Insight"}
          {date ? ` • ${date}` : ""}
        </p>
        <h1 className="text-3xl font-bold mt-2">{frontmatter?.title ?? params.slug}</h1>

        {cover && (
          <div className="relative w-full h-64 md:h-80 rounded-2xl overflow-hidden mt-6">
            <Image src={cover} alt={frontmatter?.title ?? params.slug} fill className="object-cover" />
          </div>
        )}

        {/* Render HTML produced from Markdown */}
        <article
          className="prose prose-slate mt-6 max-w-none"
          dangerouslySetInnerHTML={{ __html: html as string }}
        />
      </Container>
    </section>
  );
}
