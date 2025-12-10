// lib/careersLayoutSchema.ts
//
// Legacy shim around the new careers layout types + schema.
// This keeps any old imports working while using the new, flatter
// CareerLayout shape (no nested `props` field).

export {
  HeroSectionSchema,
  IntroSectionSchema,
  JobsListSectionSchema,
  CareerLayoutSchema,
  parseCareerLayout,
} from "./careersLayout";

export type {
  CareerLayout,
  CareerLayoutSection,
  CareerLayoutHeroSection,
  CareerLayoutIntroSection,
  CareerLayoutJobsListSection,
} from "@/types/careersLayout";
