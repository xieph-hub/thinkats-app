import type { Metadata } from "next";
import Container from "@/components/Container";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getPostCMS } from "@/lib/cms";
import { SITE_URL, SITE_NAME } from "@/lib/site";

export const dynamic = "force-dynamic"; // render per-request

export async function generateMetadata(
  { params }: { params: { slug: string } }
): Promise<Metadata> {
  const post = await getPostCMS(params.slug);
  if (!post) return { title: "Not found" };

  const title = post.frontmatter?.title
    ? `${post.frontmatter.title} | Insights`
    : `${params.slug} | Insights`;
  const description =
    post.frontmatter?.excerpt ||
    "Expert insight from Resourcin on HR, talent, and the future of work.";
  const url = `${SITE_URL}/insights/${params.slug}`;
  const og = post.frontmatter?.cover || "/og-default.jpg";

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      siteName: SITE_NAME,
      url,
      title,
      description,
      images: [{ url: og, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [og],
    },
  };
}

export default async function Page({ params }: { params: { slug: string } }) {
  const post = await getPostCMS(params.slug);
  if (!post) return notFound();

  const { frontmatter, html } = post;
  const date = frontmatter?.date ? new Date(frontmatter.date).toLocaleDateString() : null;
  const cover = typeof frontmatter?.cover === "string" ? frontmatter.cover : undefined;

  // Optional JSON-LD
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: frontmatter?.title || params.slug,
    datePublished: frontmatter?.date,
    dateModified: frontmatter?.date,
    mainEntityOfPage: `${SITE_URL}/insights/${params.slug}`,
    image: cover ? [cover] : undefined,
    author: { "@type": "Organization", name: SITE_NAME },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: { "@type": "ImageObject", url: `${SITE_URL}/logo.svg` },
    },
    description: frontmatter?.excerpt,
  };

  return (
    <section className="py-12 md:py-20">
      <Container>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <p className="text-sm text-slate-500">
          {(frontmatter?.category ?? "Insight") + (date ? ` • ${date}` : "")}
        </p>
        <h1 className="text-3xl font-bold mt-2">{frontmatter?.title ?? params.slug}</h1>

        {cover && (
          <div className="relative w-full h-64 md:h-80 rounded-2xl overflow-hidden mt-6">
            <Image
              src={cover}
              alt={frontmatter?.title ?? params.slug}
              fill
              className="object-cover"
              unoptimized
            />
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
