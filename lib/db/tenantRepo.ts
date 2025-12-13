// lib/db/tenantRepo.ts
import { PrismaClient, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type TenantOwnedModels =
  | "job"
  | "clientCompany"
  | "candidate"
  | "jobApplication"
  | "applicationEvent"
  | "applicationInterview"
  | "interviewParticipant"
  | "interviewCompetencyRating"
  | "jobStage"
  | "careerSiteSettings"
  | "careerPage"
  | "careerTheme"
  | "tag"
  | "candidateTag"
  | "candidateSkill"
  | "jobSkill"
  | "emailTemplate"
  | "sentEmail"
  | "note"
  | "activityLog"
  | "scoringEvent"
  | "savedView"
  | "analyticsSnapshot";

const TENANT_MODELS = new Set<TenantOwnedModels>([
  "job",
  "clientCompany",
  "candidate",
  "jobApplication",
  "applicationEvent",
  "applicationInterview",
  "interviewParticipant",
  "interviewCompetencyRating",
  "jobStage",
  "careerSiteSettings",
  "careerPage",
  "careerTheme",
  "tag",
  "candidateTag",
  "candidateSkill",
  "jobSkill",
  "emailTemplate",
  "sentEmail",
  "note",
  "activityLog",
  "scoringEvent",
  "savedView",
  "analyticsSnapshot",
]);

function mergeTenantWhere(where: any, tenantId: string) {
  if (!where) return { tenantId };
  if (where.tenantId) return where; // already explicitly scoped
  // ensure AND keeps existing filters
  return { AND: [{ tenantId }, where] };
}

function mergeTenantData(data: any, tenantId: string) {
  if (!data) return data;
  if (Array.isArray(data)) return data.map((d) => mergeTenantData(d, tenantId));
  if (typeof data === "object") {
    // Don’t override if caller already set it (but ideally they never should)
    if ("tenantId" in data) return data;
    return { ...data, tenantId };
  }
  return data;
}

export function getTenantRepo(tenantId: string) {
  return prisma.$extends({
    name: "tenantScope",
    query: {
      $allModels: {
        async findMany({ model, args, query }) {
          if (TENANT_MODELS.has(model as TenantOwnedModels)) {
            (args as any).where = mergeTenantWhere((args as any).where, tenantId);
          }
          return query(args);
        },
        async findFirst({ model, args, query }) {
          if (TENANT_MODELS.has(model as TenantOwnedModels)) {
            (args as any).where = mergeTenantWhere((args as any).where, tenantId);
          }
          return query(args);
        },
        async findUnique({ model, args, query }) {
          // ⚠️ findUnique can’t accept arbitrary AND filters unless unique includes tenantId.
          // Strategy: use findFirst for tenant-owned tables unless your unique keys include tenantId.
          return query(args);
        },
        async count({ model, args, query }) {
          if (TENANT_MODELS.has(model as TenantOwnedModels)) {
            (args as any).where = mergeTenantWhere((args as any).where, tenantId);
          }
          return query(args);
        },
        async create({ model, args, query }) {
          if (TENANT_MODELS.has(model as TenantOwnedModels)) {
            (args as any).data = mergeTenantData((args as any).data, tenantId);
          }
          return query(args);
        },
        async createMany({ model, args, query }) {
          if (TENANT_MODELS.has(model as TenantOwnedModels)) {
            (args as any).data = mergeTenantData((args as any).data, tenantId);
          }
          return query(args);
        },
        async updateMany({ model, args, query }) {
          if (TENANT_MODELS.has(model as TenantOwnedModels)) {
            (args as any).where = mergeTenantWhere((args as any).where, tenantId);
          }
          return query(args);
        },
        async deleteMany({ model, args, query }) {
          if (TENANT_MODELS.has(model as TenantOwnedModels)) {
            (args as any).where = mergeTenantWhere((args as any).where, tenantId);
          }
          return query(args);
        },
      },
    },
  });
}
