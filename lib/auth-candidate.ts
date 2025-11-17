// lib/auth-candidate.ts
import { cookies } from "next/headers";
import { prisma } from "./prisma";

export async function getCurrentCandidate() {
  const token = cookies().get("candidate_token")?.value;
  if (!token) return null;

  const now = new Date();

  const candidate = await prisma.candidate.findFirst({
    where: {
      loginToken: token,
      loginTokenExpiresAt: {
        gt: now,
      },
    },
    include: {
      applications: {
        include: {
          job: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  return candidate;
}
