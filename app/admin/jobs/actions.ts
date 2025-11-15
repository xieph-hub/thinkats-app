"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// Simple slug generator from title
function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "") // remove non alphanumeric
    .replace(/\s+/g, "-") // spaces to hyphen
    .replace(/-+/g, "-"); // collapse multiple hyphens
}

export async function createJob(formData: FormData) {
  const title = String(formData.get("title") || "").trim();
  const slugInput = String(formData.get("slug") || "").trim();
  const department = String(formData.get("department") || "").trim();
  const location = String(formData.get("location") || "").trim();
  const type = String(formData.get("type") || "").trim();
  const excerpt = String(formData.get("excerpt") || "").trim();
  const description = String(formData.get("description") || "").trim();

  if (!title) {
    throw new Error("Title is required");
  }

  const baseSlug = slugInput || slugify(title);

  const existingWithSlug = await prisma.job.findUnique({
    where: { slug: baseSlug },
  });

  const finalSlug =
    existingWithSlug && !slugInput
      ? `${baseSlug}-${Date.now()}`
      : baseSlug;

  await prisma.job.create({
    data: {
      title,
      slug: finalSlug,
      department: department || null,
      location: location || null,
      type: type || null,
      excerpt: excerpt || null,
      description: description || null,
      isPublished: true, // new jobs are live by default
      postedAt: new Date(),
    },
  });

  revalidatePath("/jobs");
  revalidatePath("/admin/jobs");

  redirect("/admin/jobs?created=1");
}

export async function updateJob(formData: FormData) {
  const id = String(formData.get("id") || "").trim();
  if (!id) {
    throw new Error("Job id is required");
  }

  const title = String(formData.get("title") || "").trim();
  const slugInput = String(formData.get("slug") || "").trim();
  const department = String(formData.get("department") || "").trim();
  const location = String(formData.get("location") || "").trim();
  const type = String(formData.get("type") || "").trim();
  const excerpt = String(formData.get("excerpt") || "").trim();
  const description = String(formData.get("description") || "").trim();

  if (!title) {
    throw new Error("Title is required");
  }

  const existingJob = await prisma.job.findUnique({
    where: { id },
  });

  if (!existingJob) {
    throw new Error("Job not found");
  }

  const baseSlug = slugInput || slugify(title);

  const existingWithSlug = await prisma.job.findUnique({
    where: { slug: baseSlug },
  });

  let finalSlug = baseSlug;
  if (existingWithSlug && existingWithSlug.id !== id) {
    finalSlug = `${baseSlug}-${Date.now()}`;
  }

  const job = await prisma.job.update({
    where: { id },
    data: {
      title,
      slug: finalSlug,
      department: department || null,
      location: location || null,
      type: type || null,
      excerpt: excerpt || null,
      description: description || null,
    },
  });

  revalidatePath("/jobs");
  revalidatePath("/admin/jobs");
  revalidatePath(`/jobs/${job.slug}`);

  if (existingJob.slug !== job.slug) {
    revalidatePath(`/jobs/${existingJob.slug}`);
  }

  redirect(`/admin/jobs/${id}?saved=1`);
}

export async function toggleJobPublish(formData: FormData) {
  const id = String(formData.get("id") || "").trim();
  const next = String(formData.get("next") || "").trim();

  if (!id || !next) {
    throw new Error("Missing fields");
  }

  const isPublished = next === "true";

  const job = await prisma.job.update({
    where: { id },
    data: {
      isPublished,
      ...(isPublished ? { postedAt: new Date() } : {}),
    },
  });

  revalidatePath("/jobs");
  revalidatePath("/admin/jobs");
  revalidatePath(`/jobs/${job.slug}`);

  redirect("/admin/jobs?status=updated");
}
