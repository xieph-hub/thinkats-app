// lib/careersLayoutSchema.ts
import { z } from "zod";

export const HeroSectionSchema = z.object({
  type: z.literal("hero"),
  id: z.string().optional(),
  props: z
    .object({
      title: z.string().max(200).optional(),
      subtitle: z.string().max(400).optional(),
      showSocial: z.boolean().optional(),
    })
    .optional(),
});

export const AboutSectionSchema = z.object({
  type: z.literal("about"),
  id: z.string().optional(),
  props: z
    .object({
      title: z.string().max(200).optional(),
      html: z.string().optional(),
    })
    .optional(),
});

export const FeaturedRolesSectionSchema = z.object({
  type: z.literal("featuredRoles"),
  id: z.string().optional(),
  props: z
    .object({
      limit: z.number().int().min(1).max(50).optional(),
      showViewAllLink: z.boolean().optional(),
    })
    .optional(),
});

export const RichTextSectionSchema = z.object({
  type: z.literal("richText"),
  id: z.string().optional(),
  props: z.object({
    title: z.string().max(200).optional(),
    html: z.string(),
  }),
});

export const CareerLayoutSectionSchema = z.discriminatedUnion("type", [
  HeroSectionSchema,
  AboutSectionSchema,
  FeaturedRolesSectionSchema,
  RichTextSectionSchema,
]);

export const CareerLayoutSchema = z.object({
  sections: z.array(CareerLayoutSectionSchema),
});

// Convenience parse helper
export function parseCareerLayout(input: unknown) {
  return CareerLayoutSchema.parse(input);
}
