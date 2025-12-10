// lib/careersLayout.ts
import { z } from "zod";
import type { CareerLayout } from "@/types/careersLayout";

export const HeroSectionSchema = z.object({
  type: z.literal("hero"),
  title: z.string().optional(),
  subtitle: z.string().optional(),
  align: z.enum(["left", "center", "right"]).optional(),
  showCta: z.boolean().optional(),
});

export const IntroSectionSchema = z.object({
  type: z.literal("intro"),
  title: z.string().optional(),
  bodyHtml: z.string().optional(),
});

export const JobsListSectionSchema = z.object({
  type: z.literal("jobs_list"),
  title: z.string().optional(),
  layout: z.enum(["list", "cards"]).optional(),
  showSearch: z.boolean().optional(),
  showFilters: z.boolean().optional(),
});

export const CareerLayoutSchema = z.object({
  sections: z
    .array(
      z.union([HeroSectionSchema, IntroSectionSchema, JobsListSectionSchema]),
    )
    .optional()
    .default([]),
});

export function parseCareerLayout(input: unknown): CareerLayout {
  const result = CareerLayoutSchema.safeParse(input);
  if (!result.success) {
    return { sections: [] };
  }
  // zod has already validated the shape
  return result.data as CareerLayout;
}
