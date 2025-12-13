// lib/db/tenantDb.ts
import "server-only";
import { prisma } from "@/lib/prisma";

function andTenant(where: any, tenantId: string) {
  if (!where) return { tenantId };
  return { AND: [where, { tenantId }] };
}

export function tenantDb(tenantId: string) {
  return prisma.$extends({
    query: {
      job: {
        findMany({ args, query }) {
          args.where = andTenant(args.where, tenantId);
          return query(args);
        },
        findFirst({ args, query }) {
          args.where = andTenant(args.where, tenantId);
          return query(args);
        },
        count({ args, query }) {
          args.where = andTenant(args.where, tenantId);
          return query(args);
        },
        aggregate({ args, query }) {
          args.where = andTenant(args.where, tenantId);
          return query(args);
        },
        // STOP accidental cross-tenant reads by ID
        findUnique() {
          throw new Error(
            "Unsafe: job.findUnique() is not allowed in multi-tenant mode. Use findFirst({ where: { id, tenantId } })",
          );
        },
      },

      candidate: {
        findMany({ args, query }) {
          args.where = andTenant(args.where, tenantId);
          return query(args);
        },
        findFirst({ args, query }) {
          args.where = andTenant(args.where, tenantId);
          return query(args);
        },
        count({ args, query }) {
          args.where = andTenant(args.where, tenantId);
          return query(args);
        },
        aggregate({ args, query }) {
          args.where = andTenant(args.where, tenantId);
          return query(args);
        },
        findUnique() {
          throw new Error(
            "Unsafe: candidate.findUnique() is not allowed. Use findFirst with tenantId.",
          );
        },
      },

      application: {
        findMany({ args, query }) {
          args.where = andTenant(args.where, tenantId);
          return query(args);
        },
        findFirst({ args, query }) {
          args.where = andTenant(args.where, tenantId);
          return query(args);
        },
        count({ args, query }) {
          args.where = andTenant(args.where, tenantId);
          return query(args);
        },
        aggregate({ args, query }) {
          args.where = andTenant(args.where, tenantId);
          return query(args);
        },
        findUnique() {
          throw new Error(
            "Unsafe: application.findUnique() is not allowed. Use findFirst with tenantId.",
          );
        },
      },
    },
  });
}
