// app/candidate/profile/page.tsx
import { redirect } from "next/navigation";
import { getCurrentCandidate } from "@/lib/auth-candidate";
import ProfileClient from "./ProfileClient";

export default async function CandidateProfilePage() {
  const candidate = await getCurrentCandidate();

  if (!candidate) {
    redirect("/login?from=candidate");
  }

  const profile = {
    fullName: candidate.fullName,
    email: candidate.email,
    phone: candidate.phone,
    location: candidate.location,
    linkedinUrl: candidate.linkedinUrl,
    yearsOfExperience: candidate.yearsOfExperience,
    currentRole: candidate.currentRole,
    currentCompany: candidate.currentCompany,
    primaryFunction: candidate.primaryFunction,
    seniority: candidate.seniority,
    skills: candidate.skills ?? [],
  };

  return <ProfileClient initial={profile} />;
}
