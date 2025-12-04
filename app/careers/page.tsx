const where: any = {
  status: "open",
  visibility: "public",
  tenant: {
    status: "active",
    ...(tenantSlugFilter
      ? {
          // If a specific tenant ?tenant=slug is set,
          // ALWAYS show that tenant's jobs (even if they’re not in the marketplace).
          slug: tenantSlugFilter,
        }
      : {
          // Global `/careers` (no tenant filter):
          // Only show tenants that are:
          //  - explicitly included in marketplace, OR
          //  - have no CareerSiteSettings row yet (fail open by default).
          OR: [
            {
              careerSiteSettings: {
                some: { includeInMarketplace: true },
              },
            },
            {
              careerSiteSettings: {
                none: {},
              },
            },
          ],
        }),
  },
  ...(q
    ? {
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { location: { contains: q, mode: "insensitive" } },
          {
            tenant: {
              name: { contains: q, mode: "insensitive" },
            },
          },
        ],
      }
    : {}),
};
