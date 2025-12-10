// lib/careerLayoutJsonSchema.ts

export const CareerLayoutJsonSchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "CareerLayout",
  type: "object",
  required: ["sections"],
  properties: {
    sections: {
      type: "array",
      items: {
        oneOf: [
          {
            type: "object",
            required: ["type"],
            properties: {
              type: { const: "hero" },
              id: { type: "string" },
              props: {
                type: "object",
                properties: {
                  title: { type: "string", maxLength: 200 },
                  subtitle: { type: "string", maxLength: 400 },
                  showSocial: { type: "boolean" },
                },
                additionalProperties: false,
              },
            },
            additionalProperties: false,
          },
          {
            type: "object",
            required: ["type"],
            properties: {
              type: { const: "about" },
              id: { type: "string" },
              props: {
                type: "object",
                properties: {
                  title: { type: "string", maxLength: 200 },
                  html: { type: "string" },
                },
                additionalProperties: false,
              },
            },
            additionalProperties: false,
          },
          {
            type: "object",
            required: ["type"],
            properties: {
              type: { const: "featuredRoles" },
              id: { type: "string" },
              props: {
                type: "object",
                properties: {
                  limit: {
                    type: "integer",
                    minimum: 1,
                    maximum: 50,
                  },
                  showViewAllLink: { type: "boolean" },
                },
                additionalProperties: false,
              },
            },
            additionalProperties: false,
          },
          {
            type: "object",
            required: ["type", "props"],
            properties: {
              type: { const: "richText" },
              id: { type: "string" },
              props: {
                type: "object",
                required: ["html"],
                properties: {
                  title: { type: "string", maxLength: 200 },
                  html: { type: "string" },
                },
                additionalProperties: false,
              },
            },
            additionalProperties: false,
          },
        ],
      },
    },
  },
  additionalProperties: false,
} as const;
