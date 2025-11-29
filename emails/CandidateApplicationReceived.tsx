// emails/CandidateApplicationReceived.tsx
import * as React from "react";
import ResourcinEmailLayout from "./ResourcinEmailLayout";

type CandidateApplicationReceivedProps = {
  candidateName?: string | null;
  jobTitle?: string | null;
};

export default function CandidateApplicationReceivedEmail({
  candidateName,
  jobTitle,
}: CandidateApplicationReceivedProps) {
  const firstName =
    candidateName?.trim()?.split(" ")[0] || "there";

  const displayJobTitle = jobTitle?.trim() || "this role";

  return (
    <ResourcinEmailLayout
      previewText="This is to acknowledge receipt of your application via Resourcin."
      title="Thank you for your application"
      intro={`Hi ${firstName},`}
      ctaLabel="View open roles"
      ctaUrl="https://www.resourcin.com/jobs"
      footerNote="You’re receiving this email because you applied for a role managed by Resourcin."
    >
      <p
        style={{
          fontSize: "13px",
          lineHeight: "1.6",
          margin: "0 0 12px 0",
          color: "#111827",
        }}
      >
        This is to acknowledge receipt of your application for{" "}
        <strong>{displayJobTitle}</strong>. A member of our recruitment
        team will reach out to you if you are a good fit for the role.
      </p>

      <p
        style={{
          fontSize: "13px",
          lineHeight: "1.6",
          margin: "0 0 12px 0",
          color: "#111827",
        }}
      >
        In the meantime, you can explore other mandates we&apos;re
        working on via our careers page.
      </p>

      <p
        style={{
          fontSize: "13px",
          lineHeight: "1.6",
          margin: "0 0 0 0",
          color: "#111827",
        }}
      >
        Warm regards,
        <br />
        <strong>The Resourcin team</strong>
      </p>
    </ResourcinEmailLayout>
  );
}
