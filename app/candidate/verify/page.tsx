// app/candidate/verify/page.tsx
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

type Props = {
  searchParams: { token?: string };
};

export default async function CandidateVerifyPage({ searchParams }: Props) {
  const token = searchParams.token;

  if (!token) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16">
        <h1 className="text-xl font-semibold text-slate-900">
          Invalid login link
        </h1>
        <p className="mt-3 text-sm text-slate-600">
          The link is missing a token. Please request a new login link from the
          login page.
        </p>
      </main>
    );
  }

  const candidate = await prisma.candidate.findFirst({
    where: { loginToken: token },
  });

  const now = new Date();

  if (
    !candidate ||
    !candidate.loginTokenExpiresAt ||
    candidate.loginTokenExpiresAt < now
  ) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16">
        <h1 className="text-xl font-semibold text-slate-900">
          Link expired or invalid
        </h1>
        <p className="mt-3 text-sm text-slate-600">
          This login link is no longer valid. Please request a new one from the
          login page.
        </p>
      </main>
    );
  }

  // Set cookie for this candidate
  cookies().set("candidate_token", token, {
    httpOnly: true,
    secure: true,
    path: "/",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });

  redirect("/candidate/dashboard");
}
