// types/careersLayout.ts

export type CareerLayoutHeroSection = {
  type: "hero";
  title?: string;
  subtitle?: string;
  align?: "left" | "center" | "right";
  showCta?: boolean;
};

export type CareerLayoutIntroSection = {
  type: "intro";
  title?: string;
  bodyHtml?: string;
};

export type CareerLayoutJobsListSection = {
  type: "jobs_list";
  title?: string;
  layout?: "list" | "cards";
  showSearch?: boolean;
  showFilters?: boolean;
};

export type CareerLayoutSection =
  | CareerLayoutHeroSection
  | CareerLayoutIntroSection
  | CareerLayoutJobsListSection;

export type CareerLayout = {
  sections: CareerLayoutSection[];
};
