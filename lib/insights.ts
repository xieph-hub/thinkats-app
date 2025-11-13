
import fs from "fs";
import path from "path";
import matter from "gray-matter";

export type Post = {
  slug: string;
  title: string;
  excerpt?: string;
  date?: string;
  category?: string;
};

const insightsDir = path.join(process.cwd(), "content", "insights");

export function getAllPosts(): Post[] {
  if (!fs.existsSync(insightsDir)) return [];
  const files = fs.readdirSync(insightsDir).filter(f => f.endsWith(".md"));
  const posts = files.map(file => {
    const slug = file.replace(/\.md$/, "");
    const filePath = path.join(insightsDir, file);
    const raw = fs.readFileSync(filePath, "utf-8");
    const { data, content } = matter(raw);
    const excerpt = (data.excerpt as string) ?? content.slice(0, 160).replace(/\n/g, " ") + "...";
    return {
      slug,
      title: (data.title as string) ?? slug,
      excerpt,
      date: (data.date as string) ?? undefined,
      category: (data.category as string) ?? undefined,
    } as Post;
  });
  // sort by date desc if available
  return posts.sort((a,b) => (b.date ?? "").localeCompare(a.date ?? ""));
}

export function getPost(slug: string): { frontmatter: any; content: string } | null {
  const filePath = path.join(insightsDir, `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);
  return { frontmatter: data, content };
}
