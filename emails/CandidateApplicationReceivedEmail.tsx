// emails/CandidateApplicationReceived.tsx
import * as React from "react";
import ResourcinEmailLayout from "./ResourcinEmailLayout";

export type CandidateApplicationReceivedEmailProps = {
  candidateName: string;
  jobTitle: string;
  jobPublicUrl: string;
  candidateEmail: string;
  source: string;
};

export default function CandidateApplicationReceivedEmail({
  candidateName,
  jobTitle,
  jobPublicUrl,
  candidateEmail,
  source,
}: CandidateApplicationReceivedEmailProps) {
  const safeName = candidateName || "there";

  return (
    <ResourcinEmailLayout
      title="Application received"
      previewText={`We’ve received your application for ${jobTitle}.`}
    >
      <p style={{ margin: "0 0 12px 0" }}>Hi {safeName},</p>

      <p style={{ margin: "0 0 12px 0" }}>
        This is to acknowledge receipt of your application for the{" "}
        <strong>{jobTitle}</strong> role via Resourcin.
      </p>

      <p style={{ margin: "0 0 12px 0" }}>
        A member of our recruitment team will review your profile carefully. If
        you are a strong fit for the role, a member of our team will reach out
        to you to discuss next steps.
      </p>

      {/* Small summary box */}
      <div
        style={{
          marginTop: "16px",
          padding: "12px 14px",
          borderRadius: "10px",
          backgroundColor: "#f9fafb",
          border: "1px solid #e5e7eb",
          fontSize: "13px",
          color: "#4b5563",
        }}
      >
        <div style={{ marginBottom: "4px" }}>
          <span style={{ fontWeight: 600, color: "#111827" }}>Role:</span>{" "}
          <a
            href={jobPublicUrl}
            style={{ color: "#172965", textDecoration: "none" }}
          >
            {jobTitle}
          </a>
        </div>
        <div style={{ marginBottom: "4px" }}>
          <span style={{ fontWeight: 600, color: "#111827" }}>Email:</span>{" "}
          <span>{candidateEmail}</span>
        </div>
        {source ? (
          <div>
            <span style={{ fontWeight: 600, color: "#111827" }}>Source:</span>{" "}
            <span>{source}</span>
          </div>
        ) : null}
      </div>

      <p style={{ marginTop: "18px", marginBottom: 0, fontSize: "13px" }}>
        Best regards,
        <br />
        Resourcin Recruitment Team
      </p>
    </ResourcinEmailLayout>
  );
}
