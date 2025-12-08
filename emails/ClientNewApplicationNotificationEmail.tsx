// emails/ClientNewApplicationNotificationEmail.tsx
import * as React from "react";
import ThinkATSEmailLayout from "./ThinkATSEmailLayout";

export interface ClientNewApplicationNotificationEmailProps {
  clientName: string;
  jobTitle: string;
  jobLocation?: string;
  candidateName: string;
  candidateEmail: string;
  source?: string;
  atsLink: string;
}

export default function ClientNewApplicationNotificationEmail(
  props: ClientNewApplicationNotificationEmailProps,
) {
  const {
    clientName,
    jobTitle,
    jobLocation,
    candidateName,
    candidateEmail,
    source,
    atsLink,
  } = props;

  const safeClient = clientName || "Hiring team";
  const roleLine = jobLocation
    ? `${jobTitle} – ${jobLocation}`
    : jobTitle || "your role";

  return (
    <ThinkATSEmailLayout
      title="New candidate for your role"
      preheader={`New candidate for ${jobTitle}`}
    >
      <div style={{ fontSize: 14, lineHeight: 1.6, color: "#374151" }}>
        <p style={{ margin: "0 0 12px 0" }}>Hi {safeClient},</p>
        <p style={{ margin: "0 0 12px 0" }}>
          You have a new candidate for the{" "}
          <strong>{roleLine}</strong> role being managed via ThinkATS.
        </p>
      </div>

      <div
        style={{
          marginTop: 16,
          padding: "12px 14px",
          borderRadius: 12,
          backgroundColor: "#F9FAFB",
          border: "1px solid #E5E7EB",
          borderLeft: "4px solid #64C247",
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
          <div style={{ marginBottom: 2 }}>
            <span style={{ fontWeight: 600, color: "#111827" }}>Source:</span>{" "}
            {source}
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
        You can review this candidate and others for the role via your ThinkATS
        pipeline:
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
