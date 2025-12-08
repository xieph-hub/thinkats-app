// emails/CandidateApplicationReceived.tsx
import * as React from "react";
import ThinkATSEmailLayout from "./ThinkATSEmailLayout";

export interface CandidateApplicationReceivedProps {
  candidateName: string;
  jobTitle: string;
  jobLocation?: string;
  jobPublicUrl: string;
  candidateEmail: string;
  source?: string;
}

export default function CandidateApplicationReceived(
  props: CandidateApplicationReceivedProps,
) {
  const {
    candidateName,
    jobTitle,
    jobLocation,
    jobPublicUrl,
    candidateEmail,
    source,
  } = props;

  const safeName = candidateName || "there";
  const roleLine = jobLocation
    ? `${jobTitle} – ${jobLocation}`
    : jobTitle || "this role";

  return (
    <ThinkATSEmailLayout
      title="Application received"
      preheader={`We've received your application for ${jobTitle}`}
    >
      <div style={{ fontSize: 14, lineHeight: 1.6, color: "#374151" }}>
        <p style={{ margin: "0 0 12px 0" }}>Hi {safeName},</p>

        <p style={{ margin: "0 0 12px 0" }}>
          Thank you for applying for the{" "}
          <strong>{jobTitle}</strong>{" "}
          {jobLocation ? (
            <>
              role in <strong>{jobLocation}</strong>{" "}
            </>
          ) : (
            "role "
          )}
          via ThinkATS.
        </p>

        <p style={{ margin: "0 0 12px 0" }}>
          We&apos;ve received your application and our recruitment team will
          review it carefully. If your profile is a close match for the role,
          we&apos;ll reach out to discuss next steps.
        </p>
      </div>

      {/* Role summary card */}
      <div
        style={{
          marginTop: 16,
          padding: "12px 14px",
          borderRadius: 12,
          backgroundColor: "#F9FAFB",
          border: "1px solid #E5E7EB",
          borderLeft: "4px solid #172965",
          fontSize: 13,
          color: "#4B5563",
        }}
      >
        <div style={{ marginBottom: 4 }}>
          <span style={{ fontWeight: 600, color: "#111827" }}>Role: </span>
          <a
            href={jobPublicUrl}
            style={{ color: "#172965", textDecoration: "none" }}
          >
            {roleLine}
          </a>
        </div>
        <div style={{ marginBottom: 4 }}>
          <span style={{ fontWeight: 600, color: "#111827" }}>
            Submitted with:
          </span>{" "}
          <a
            href={`mailto:${candidateEmail}`}
            style={{ color: "#172965", textDecoration: "none" }}
          >
            {candidateEmail}
          </a>
        </div>
        {source && (
          <div style={{ marginBottom: 2 }}>
            <span style={{ fontWeight: 600, color: "#111827" }}>
              Application source:
            </span>{" "}
            <span>{source}</span>
          </div>
        )}
      </div>

      <p
        style={{
          marginTop: 18,
          marginBottom: 0,
          fontSize: 13,
          color: "#4B5563",
        }}
      >
        Best regards,
        <br />
        ThinkATS team
        <br />
        <span style={{ fontSize: 12, color: "#6B7280" }}>
          Applicant tracking &amp; careers sites
        </span>
      </p>
    </ThinkATSEmailLayout>
  );
}
