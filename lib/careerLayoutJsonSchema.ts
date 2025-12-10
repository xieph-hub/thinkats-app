// lib/careersLayoutSchema.ts
import type {
  CareerLayout,
  CareerLayoutSection,
} from "@/types/careersLayout";

class LayoutValidationError extends Error {
  issues: any[];

  constructor(issues: any[]) {
    super("Invalid career layout");
    this.name = "LayoutValidationError";
    this.issues = issues;
  }
}

type RawSection = {
  type?: unknown;
  props?: any;
};

export function parseCareerLayout(input: unknown): CareerLayout {
  const issues: any[] = [];

  if (!input || typeof input !== "object") {
    issues.push({ path: [], message: "Layout must be an object" });
    throw new LayoutValidationError(issues);
  }

  const raw = input as any;
  const rawSections = raw.sections;

  if (!Array.isArray(rawSections)) {
    issues.push({
      path: ["sections"],
      message: "sections must be an array",
    });
    throw new LayoutValidationError(issues);
  }

  if (rawSections.length === 0) {
    issues.push({
      path: ["sections"],
      message: "sections must contain at least one section",
    });
  }

  if (rawSections.length > 20) {
    issues.push({
      path: ["sections"],
      message: "sections cannot contain more than 20 sections",
    });
  }

  const sections: CareerLayoutSection[] = [];

  rawSections.forEach((section: RawSection, index: number) => {
    const pathPrefix = ["sections", index];

    if (!section || typeof section !== "object") {
      issues.push({
        path: pathPrefix,
        message: "Each section must be an object",
      });
      return;
    }

    const type = section.type;

    if (typeof type !== "string") {
      issues.push({
        path: [...pathPrefix, "type"],
        message: "Section type must be a string",
      });
      return;
    }

    const props = (section.props && typeof section.props === "object"
      ? section.props
      : {}) as any;

    if (type === "hero") {
      const normalized: CareerLayoutSection = {
        type: "hero",
        props: {
          title:
            typeof props.title === "string" && props.title.trim()
              ? props.title.trim()
              : undefined,
          subtitle:
            typeof props.subtitle === "string" && props.subtitle.trim()
              ? props.subtitle.trim()
              : undefined,
          hide:
            typeof props.hide === "boolean" ? props.hide : undefined,
        },
      };
      sections.push(normalized);
      return;
    }

    if (type === "about") {
      const normalized: CareerLayoutSection = {
        type: "about",
        props: {
          title:
            typeof props.title === "string" && props.title.trim()
              ? props.title.trim()
              : undefined,
          html:
            typeof props.html === "string" && props.html.trim()
              ? props.html
              : undefined,
          hide:
            typeof props.hide === "boolean" ? props.hide : undefined,
        },
      };
      sections.push(normalized);
      return;
    }

    if (type === "featuredRoles") {
      let limit: number | undefined;

      if (typeof props.limit === "number" && Number.isInteger(props.limit)) {
        limit = props.limit;
      } else if (typeof props.limit === "string") {
        const parsed = Number.parseInt(props.limit, 10);
        if (!Number.isNaN(parsed)) {
          limit = parsed;
        }
      }

      if (limit !== undefined) {
        if (limit < 1 || limit > 50) {
          issues.push({
            path: [...pathPrefix, "props", "limit"],
            message: "featuredRoles.limit must be between 1 and 50",
          });
        }
      }

      const normalized: CareerLayoutSection = {
        type: "featuredRoles",
        props: {
          limit: limit ?? 8,
          hide:
            typeof props.hide === "boolean" ? props.hide : undefined,
        },
      };
      sections.push(normalized);
      return;
    }

    // Unknown section type
    issues.push({
      path: [...pathPrefix, "type"],
      message: `Unsupported section type: ${String(type)}`,
    });
  });

  if (issues.length > 0) {
    throw new LayoutValidationError(issues);
  }

  // If everything passed, return normalized layout
  const layout: CareerLayout = {
    sections,
  };

  return layout;
}
