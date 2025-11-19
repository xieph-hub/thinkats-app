2025-11-19 15:14:39.544 [error] POST /api/jobs error PrismaClientValidationError: 
Invalid `prisma.job.create()` invocation:

{
  data: {
    tenantId: "tenant_resourcin_1",
    clientCompanyId: null,
    title: "Head of Shipping",
    slug: "head-of-shipping",
    location: "Lagos",
    function: "Operations",
    employmentType: null,
    seniority: "lead",
    summary: null,
    description: "Dummy",
    tags: [],
    isPublished: false,
+   tenant: {
+     create: TenantCreateWithoutJobsInput | TenantUncheckedCreateWithoutJobsInput,
+     connectOrCreate: TenantCreateOrConnectWithoutJobsInput,
+     connect: TenantWhereUniqueInput
+   }
  }
}

Argument `tenant` is missing.
    at wn (/var/task/node_modules/@prisma/client/runtime/library.js:29:1363)
    at $n.handleRequestError (/var/task/node_modules/@prisma/client/runtime/library.js:121:6958)
    at $n.handleAndLogRequestError (/var/task/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/var/task/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/var/task/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async j (/var/task/.next/server/app/api/jobs/route.js:1:2410)
    at async /var/task/node_modules/next/dist/compiled/next-server/app-route.runtime.prod.js:6:36258
    at async eR.execute (/var/task/node_modules/next/dist/compiled/next-server/app-route.runtime.prod.js:6:26874)
    at async eR.handle (/var/task/node_modules/next/dist/compiled/next-server/app-route.runtime.prod.js:6:37512)
    at async es (/var/task/node_modules/next/dist/compiled/next-server/server.runtime.prod.js:16:25465) {
  clientVersion: '5.22.0'
}
