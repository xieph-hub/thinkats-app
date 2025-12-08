// emails/InternalNewApplicationNotificationEmail.tsx
import * as React from "react";
import ThinkATSEmailLayout from "./ThinkATSEmailLayout";

export interface InternalNewApplicationNotificationEmailProps {
  jobTitle: string;
  jobLocation?: string;
  candidateName: string;
  candidateEmail: string;
  source?: string;
  atsLink: string;
  linkedinUrl?: string;
  currentGrossAnnual?: string;
  expectation?: string;
  noticePeriod?: string;
}

export default function InternalNewApplicationNotificationEmail(
  props: InternalNewApplicationNotificationEmailProps,
) {
  const {
    jobTitle,
    jobLocation,
    candidateName,
    candidateEmail,
    source,
    atsLink,
    linkedinUrl,
    currentGrossAnnual,
    expectation,
    noticePeriod,
  } = props;

  const roleLine = jobLocation
    ? `${jobTitle} – ${jobLocation}`
    : jobTitle || "role";

  return (
    <ThinkATSEmailLayout
      title="New application in your ATS"
      preheader={`New application received for ${jobTitle}`}
    >
      <div style={{ fontSize: 14, lineHeight: 1.6, color: "#374151" }}>
        <p style={{ margin: "0 0 12px 0" }}>Hi team,</p>
        <p style={{ margin: "0 0 12px 0" }}>
          A new candidate has applied for the{" "}
          <strong>{roleLine}</strong> role via ThinkATS.
        </p>
      </div>

      <div
        style={{
          marginTop: 16,
          padding: "12px 14px",
          borderRadius: 12,
          backgroundColor: "#F9FAFB",
          border: "1px solid #E5E7EB",
          borderLeft: "4px solid "#306B34",
          fontSize: 13,
          color: "#4B5563",
        }}
      >
        <div style={{ marginBottom: 4 }}>
          <span style={{ fontWeight: 600, color: "#111827" }}>
            Candidate:
          </span>{" "}
          {candidateName}{" "}
          <a
            href={`mailto:${candidateEmail}`}
            style={{ color: "#172965", textDecoration: "none" }}
          >
            ({candidateEmail})
          </a>
        </div>

        <div style={{ marginBottom: 4 }}>
          <span style={{ fontWeight: 600, color: "#111827" }}>Role:</span>{" "}
          {roleLine}
        </div>

        {source && (
          <div style={{ marginBottom: 4 }}>
            <span style={{ fontWeight: 600, color: "#111827" }}>Source:</span>{" "}
            {source}
          </div>
        )}

        {linkedinUrl && (
          <div style={{ marginBottom: 4 }}>
            <span style={{ fontWeight: 600, color: "#111827" }}>
              LinkedIn:
            </span>{" "}
            <a
              href={linkedinUrl}
              style={{ color: "#172965", textDecoration: "none" }}
            >
              View profile
            </a>
          </div>
        )}

        {currentGrossAnnual && (
          <div style={{ marginBottom: 2 }}>
            <span style={{ fontWeight: 600, color: "#111827" }}>
              Current gross:
            </span>{" "}
            {currentGrossAnnual}
          </div>
        )}
        {expectation && (
          <div style={{ marginBottom: 2 }}>
            <span style={{ fontWeight: 600, color: "#111827" }}>
              Expectation:
            </span>{" "}
            {expectation}
          </div>
        )}
        {noticePeriod && (
          <div style={{ marginBottom: 2 }}>
            <span style={{ fontWeight: 600, color: "#111827" }}>
              Notice period:
            </span>{" "}
            {noticePeriod}
          </div>
        )}
      </div>

      <p
        style={{
          marginTop: 16,
          marginBottom: 0,
          fontSize: 13,
          color: "#374151",
        }}
      >
        You can review this candidate and others for the role directly in your
        ATS view:
        <br />
        <a
          href={atsLink}
          style={{
            display: "inline-block",
            marginTop: 6,
            padding: "7px 14px",
            borderRadius: 999,
            backgroundColor: "#172965",
            color: "#FFFFFF",
            fontSize: 12,
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          Open pipeline in ATS
        </a>
      </p>
    </ThinkATSEmailLayout>
  );
}
