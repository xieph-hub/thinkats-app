// lib/careersLayout.ts
import { z } from "zod";

// --- Section schemas -------------------------------------------------------

export const HeroSectionSchema = z.object({
  type: z.literal("hero"),
  eyebrow: z.string().optional(),
  title: z.string().min(1),
  subtitle: z.string().optional(),
  align: z.enum(["left", "center"]).default("left"),
  variant: z.enum(["solid", "soft"]).default("solid"),
});

export const RichTextSectionSchema = z.object({
  type: z.literal("rich_text"),
  title: z.string().optional(),
  html: z.string().optional(),
});

export const ValuesSectionSchema = z.object({
  type: z.literal("values"),
  title: z.string().optional(),
  items: z
    .array(
      z.object({
        label: z.string(),
        description: z.string().optional(),
      }),
    )
    .default([]),
});

export const StatsSectionSchema = z.object({
  type: z.literal("stats"),
  title: z.string().optional(),
  items: z
    .array(
      z.object({
        label: z.string(),
        value: z.string(),
      }),
    )
    .default([]),
});

export const JobsListSectionSchema = z.object({
  type: z.literal("jobs_list"),
  title: z.string().optional(),
  intro: z.string().optional(),
  layout: z.enum(["cards", "rows"]).default("cards"),
});

// --- Root schemas ----------------------------------------------------------

export const CareerLayoutSectionSchema = z.discriminatedUnion("type", [
  HeroSectionSchema,
  RichTextSectionSchema,
  ValuesSectionSchema,
  StatsSectionSchema,
  JobsListSectionSchema,
]);

export const CareerPageLayoutSchema = z.object({
  sections: z.array(CareerLayoutSectionSchema).default([]),
});

// --- Types -----------------------------------------------------------------

export type CareerLayoutSection = z.infer<typeof CareerLayoutSectionSchema>;
export type CareerLayout = z.infer<typeof CareerPageLayoutSchema>;

// --- Helpers ---------------------------------------------------------------

export function getDefaultCareerLayout(): CareerLayout {
  return {
    sections: [
      {
        type: "hero",
        eyebrow: "Join the team",
        title: "Open roles",
        subtitle:
          "Browse current opportunities and apply in a few minutes. No cover letters required.",
        align: "left",
        variant: "solid",
      },
      {
        type: "jobs_list",
        title: "Open positions",
        intro:
          "We’re always looking for thoughtful builders across operations, product, engineering and growth.",
        layout: "cards",
      },
    ],
  };
}

export function parseCareerLayout(input: unknown): CareerLayout {
  try {
    return CareerPageLayoutSchema.parse(input);
  } catch {
    return getDefaultCareerLayout();
  }
}
