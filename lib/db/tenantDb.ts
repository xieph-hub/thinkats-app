// lib/db/tenantDb.ts
import "server-only";
import { prisma } from "@/lib/prisma";

function andWhere(where: any, extra: any) {
  if (!where) return extra;
  return { AND: [where, extra] };
}

function withTenantId(args: any, tenantId: string) {
  args.where = andWhere(args.where, { tenantId });
  return args;
}

function withTenantViaJob(args: any, tenantId: string) {
  // For JobApplication + related tables that don't carry tenantId
  args.where = andWhere(args.where, { job: { tenantId } });
  return args;
}

function withTenantViaApplication(args: any, tenantId: string) {
  // For ApplicationEvent / Interview etc.
  args.where = andWhere(args.where, { application: { job: { tenantId } } });
  return args;
}

function withTenantViaInterview(args: any, tenantId: string) {
  args.where = andWhere(args.where, {
    interview: { application: { job: { tenantId } } },
  });
  return args;
}

function blockFindUnique(modelName: string) {
  return () => {
    throw new Error(
      `Unsafe multi-tenant query: ${modelName}.findUnique() is not allowed. Use findFirst({ where: { id, ...tenantScope } })`,
    );
  };
}

export function tenantDb(tenantId: string) {
  return prisma.$extends({
    query: {
      // ----------------------------
      // TENANT-ID MODELS (direct)
      // ----------------------------
      job: {
        findMany({ args, query }) {
          return query(withTenantId(args, tenantId));
        },
        findFirst({ args, query }) {
          return query(withTenantId(args, tenantId));
        },
        count({ args, query }) {
          return query(withTenantId(args, tenantId));
        },
        aggregate({ args, query }) {
          return query(withTenantId(args, tenantId));
        },
        findUnique: blockFindUnique("job"),
      },

      clientCompany: {
        findMany({ args, query }) {
          return query(withTenantId(args, tenantId));
        },
        findFirst({ args, query }) {
          return query(withTenantId(args, tenantId));
        },
        count({ args, query }) {
          return query(withTenantId(args, tenantId));
        },
        findUnique: blockFindUnique("clientCompany"),
      },

      candidate: {
        findMany({ args, query }) {
          return query(withTenantId(args, tenantId));
        },
        findFirst({ args, query }) {
          return query(withTenantId(args, tenantId));
        },
        count({ args, query }) {
          return query(withTenantId(args, tenantId));
        },
        findUnique: blockFindUnique("candidate"),
      },

      tag: {
        findMany({ args, query }) {
          return query(withTenantId(args, tenantId));
        },
        findFirst({ args, query }) {
          return query(withTenantId(args, tenantId));
        },
        count({ args, query }) {
          return query(withTenantId(args, tenantId));
        },
        findUnique: blockFindUnique("tag"),
      },

      jobStage: {
        findMany({ args, query }) {
          return query(withTenantId(args, tenantId));
        },
        findFirst({ args, query }) {
          return query(withTenantId(args, tenantId));
        },
        count({ args, query }) {
          return query(withTenantId(args, tenantId));
        },
        findUnique: blockFindUnique("jobStage"),
      },

      note: {
        findMany({ args, query }) {
          return query(withTenantId(args, tenantId));
        },
        findFirst({ args, query }) {
          return query(withTenantId(args, tenantId));
        },
        count({ args, query }) {
          return query(withTenantId(args, tenantId));
        },
        findUnique: blockFindUnique("note"),
      },

      sentEmail: {
        findMany({ args, query }) {
          return query(withTenantId(args, tenantId));
        },
        findFirst({ args, query }) {
          return query(withTenantId(args, tenantId));
        },
        count({ args, query }) {
          return query(withTenantId(args, tenantId));
        },
        findUnique: blockFindUnique("sentEmail"),
      },

      activityLog: {
        findMany({ args, query }) {
          return query(withTenantId(args, tenantId));
        },
        findFirst({ args, query }) {
          return query(withTenantId(args, tenantId));
        },
        count({ args, query }) {
          return query(withTenantId(args, tenantId));
        },
        findUnique: blockFindUnique("activityLog"),
      },

      scoringEvent: {
        findMany({ args, query }) {
          return query(withTenantId(args, tenantId));
        },
        findFirst({ args, query }) {
          return query(withTenantId(args, tenantId));
        },
        count({ args, query }) {
          return query(withTenantId(args, tenantId));
        },
        findUnique: blockFindUnique("scoringEvent"),
      },

      savedView: {
        findMany({ args, query }) {
          return query(withTenantId(args, tenantId));
        },
        findFirst({ args, query }) {
          return query(withTenantId(args, tenantId));
        },
        count({ args, query }) {
          return query(withTenantId(args, tenantId));
        },
        findUnique: blockFindUnique("savedView"),
      },

      analyticsSnapshot: {
        findMany({ args, query }) {
          return query(withTenantId(args, tenantId));
        },
        findFirst({ args, query }) {
          return query(withTenantId(args, tenantId));
        },
        count({ args, query }) {
          return query(withTenantId(args, tenantId));
        },
        findUnique: blockFindUnique("analyticsSnapshot"),
      },

      careerSiteSettings: {
        findMany({ args, query }) {
          return query(withTenantId(args, tenantId));
        },
        findFirst({ args, query }) {
          return query(withTenantId(args, tenantId));
        },
        count({ args, query }) {
          return query(withTenantId(args, tenantId));
        },
        findUnique: blockFindUnique("careerSiteSettings"),
      },

      careerTheme: {
        findMany({ args, query }) {
          // themes can be tenant scoped or system
          args.where = andWhere(args.where, {
            OR: [{ tenantId }, { isSystem: true }],
          });
          return query(args);
        },
        findFirst({ args, query }) {
          args.where = andWhere(args.where, {
            OR: [{ tenantId }, { isSystem: true }],
          });
          return query(args);
        },
        count({ args, query }) {
          args.where = andWhere(args.where, {
            OR: [{ tenantId }, { isSystem: true }],
          });
          return query(args);
        },
        findUnique: blockFindUnique("careerTheme"),
      },

      careerPage: {
        findMany({ args, query }) {
          return query(withTenantId(args, tenantId));
        },
        findFirst({ args, query }) {
          return query(withTenantId(args, tenantId));
        },
        count({ args, query }) {
          return query(withTenantId(args, tenantId));
        },
        findUnique: blockFindUnique("careerPage"),
      },

      // skills can be tenant scoped OR global
      skill: {
        findMany({ args, query }) {
          args.where = andWhere(args.where, {
            OR: [{ tenantId }, { isGlobal: true }],
          });
          return query(args);
        },
        findFirst({ args, query }) {
          args.where = andWhere(args.where, {
            OR: [{ tenantId }, { isGlobal: true }],
          });
          return query(args);
        },
        count({ args, query }) {
          args.where = andWhere(args.where, {
            OR: [{ tenantId }, { isGlobal: true }],
          });
          return query(args);
        },
        findUnique: blockFindUnique("skill"),
      },

      candidateSkill: {
        findMany({ args, query }) {
          return query(withTenantId(args, tenantId));
        },
        findFirst({ args, query }) {
          return query(withTenantId(args, tenantId));
        },
        count({ args, query }) {
          return query(withTenantId(args, tenantId));
        },
        findUnique: blockFindUnique("candidateSkill"),
      },

      jobSkill: {
        findMany({ args, query }) {
          return query(withTenantId(args, tenantId));
        },
        findFirst({ args, query }) {
          return query(withTenantId(args, tenantId));
        },
        count({ args, query }) {
          return query(withTenantId(args, tenantId));
        },
        findUnique: blockFindUnique("jobSkill"),
      },

      // ----------------------------
      // NO tenantId on JobApplication (must scope via job.tenantId)
      // ----------------------------
      jobApplication: {
        findMany({ args, query }) {
          return query(withTenantViaJob(args, tenantId));
        },
        findFirst({ args, query }) {
          return query(withTenantViaJob(args, tenantId));
        },
        count({ args, query }) {
          return query(withTenantViaJob(args, tenantId));
        },
        aggregate({ args, query }) {
          return query(withTenantViaJob(args, tenantId));
        },
        findUnique: blockFindUnique("jobApplication"),
      },

      applicationEvent: {
        findMany({ args, query }) {
          return query(withTenantViaApplication(args, tenantId));
        },
        findFirst({ args, query }) {
          return query(withTenantViaApplication(args, tenantId));
        },
        count({ args, query }) {
          return query(withTenantViaApplication(args, tenantId));
        },
        findUnique: blockFindUnique("applicationEvent"),
      },

      applicationInterview: {
        findMany({ args, query }) {
          return query(withTenantViaApplication(args, tenantId));
        },
        findFirst({ args, query }) {
          return query(withTenantViaApplication(args, tenantId));
        },
        count({ args, query }) {
          return query(withTenantViaApplication(args, tenantId));
        },
        findUnique: blockFindUnique("applicationInterview"),
      },

      interviewParticipant: {
        findMany({ args, query }) {
          return query(withTenantViaInterview(args, tenantId));
        },
        findFirst({ args, query }) {
          return query(withTenantViaInterview(args, tenantId));
        },
        count({ args, query }) {
          return query(withTenantViaInterview(args, tenantId));
        },
        findUnique: blockFindUnique("interviewParticipant"),
      },

      interviewCompetencyRating: {
        findMany({ args, query }) {
          return query(withTenantViaInterview(args, tenantId));
        },
        findFirst({ args, query }) {
          return query(withTenantViaInterview(args, tenantId));
        },
        count({ args, query }) {
          return query(withTenantViaInterview(args, tenantId));
        },
        findUnique: blockFindUnique("interviewCompetencyRating"),
      },
    },
  });
}
