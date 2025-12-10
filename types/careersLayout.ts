// types/careersLayout.ts

export type CareerLayoutHeroSection = {
  type: "hero";
  props?: {
    title?: string;
    subtitle?: string;
    hide?: boolean;
  };
};

export type CareerLayoutAboutSection = {
  type: "about";
  props?: {
    title?: string;
    html?: string;
    hide?: boolean;
  };
};

export type CareerLayoutFeaturedRolesSection = {
  type: "featuredRoles";
  props?: {
    limit?: number; // how many roles to show on the homepage
    hide?: boolean;
  };
};

export type CareerLayoutSection =
  | CareerLayoutHeroSection
  | CareerLayoutAboutSection
  | CareerLayoutFeaturedRolesSection;

export type CareerLayout = {
  sections: CareerLayoutSection[];
};
