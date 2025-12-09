  const jobs = await prisma.job.findMany({
    where: {
      tenantId,
      isPublished: true,
    },
    orderBy: { createdAt: "desc" },
    take: 25,
    select: {
      id: true,
      slug: true,
      title: true,
      location: true,
      employmentType: true,
      seniority: true,
      summary: true,
    },
  });
