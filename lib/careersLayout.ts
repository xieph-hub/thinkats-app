// lib/careersLayout.ts

// Discriminated union of section types
export type CareerLayoutSection =
  | HeroSectionNode
  | AboutSectionNode
  | FeaturedRolesSectionNode
  | RichTextSectionNode;

export type HeroSectionNode = {
  type: "hero";
  id?: string;
  props?: {
    title?: string;
    subtitle?: string;
    showSocial?: boolean; // default true
  };
};

export type AboutSectionNode = {
  type: "about";
  id?: string;
  props?: {
    title?: string; // overrides "About {displayName}" if set
    html?: string; // rich text HTML
  };
};

export type FeaturedRolesSectionNode = {
  type: "featuredRoles";
  id?: string;
  props?: {
    limit?: number; // default 8
    showViewAllLink?: boolean; // future use
  };
};

export type RichTextSectionNode = {
  type: "richText";
  id?: string;
  props?: {
    title?: string;
    html: string;
  };
};

// Canonical layout shape saved in DB
export type CareerLayout = {
  sections: CareerLayoutSection[];
};
