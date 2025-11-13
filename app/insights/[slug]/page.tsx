import Container from "@/components/Container";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getPostCMS } from "@/lib/cms";

export const dynamic = "force-dynamic"; // render per-request so new posts don't 404

export default async function Page({ params }: { params: { slug: string } }) {
  const post = await getPostCMS(params.slug);
  if (!post) return notFound();

  const { frontmatter, html } = post;
  const date = frontmatter?.date ? new Date(frontmatter.date).toLocaleDateString() : null;
  const cover = typeof frontmatter?.cover === "string" ? frontmatter.cover : undefined;

  return (
    <section className="py-12 md:py-20">
      <Container>
        <p className="text-sm text-slate-500">
          {(frontmatter?.category ?? "Insight") + (date ? ` • ${date}` : "")}
        </p>
        <h1 className="text-3xl font-bold mt-2">{frontmatter?.title ?? params.slug}</h1>

        {cover && (
          <div className="relative w-full h-64 md:h-80 rounded-2xl overflow-hidden mt-6">
            <Image src={cover} alt={frontmatter?.title ?? params.slug} fill className="object-cover" />
          </div>
        )}

        <article
          className="prose prose-slate mt-6 max-w-none"
          dangerouslySetInnerHTML={{ __html: (html || "") as string }}
        />
      </Container>
    </section>
  );
}
