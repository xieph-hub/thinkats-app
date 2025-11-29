// emails/InternalNewApplicationNotificationEmail.tsx
import * as React from "react";
import ResourcinEmailLayout from "./ResourcinEmailLayout";

type InternalNewApplicationNotificationEmailProps = {
  jobTitle: string;
  jobLocation?: string | null;
  candidateName: string;
  candidateEmail: string;
  source?: string | null;
  atsLink?: string | null;
  linkedinUrl?: string | null;
  currentGrossAnnual?: string | null;
  expectation?: string | null;
  noticePeriod?: string | null;
};

export default function InternalNewApplicationNotificationEmail({
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
}: InternalNewApplicationNotificationEmailProps) {
  const displayLocation = jobLocation?.trim();
  const displaySource = source?.trim();
  const hasAtsLink = Boolean(atsLink);

  const pStyle: React.CSSProperties = {
    fontSize: "13px",
    lineHeight: "1.6",
    margin: "0 0 12px 0",
    color: "#111827",
  };

  const listStyle: React.CSSProperties = {
    fontSize: "13px",
    lineHeight: "1.6",
    margin: "0 0 12px 16px",
    color: "#111827",
    paddingLeft: "0",
  };

  return (
    <ResourcinEmailLayout
      previewText={`New application for ${jobTitle} via Resourcin careers site.`}
      title={`New application: ${jobTitle}`}
      intro="Hi team,"
      ctaLabel={hasAtsLink ? "Open in ATS" : undefined}
      ctaUrl={hasAtsLink ? atsLink || undefined : undefined}
      footerNote="Internal notification from ThinkATS / Resourcin. You can adjust recipients in configuration."
    >
      <p style={pStyle}>
        A new candidate just applied for{" "}
        <strong>{jobTitle}</strong>
        {displayLocation ? ` (${displayLocation})` : ""}.
      </p>

      <ul style={listStyle}>
        <li>
          <strong>Name:</strong> {candidateName}
        </li>
        <li>
          <strong>Email:</strong> {candidateEmail}
        </li>
        {displaySource && (
          <li>
            <strong>Source:</strong> {displaySource}
          </li>
        )}
        {linkedinUrl && (
          <li>
            <strong>LinkedIn:</strong>{" "}
            <a
              href={linkedinUrl}
              target="_blank"
              rel="noreferrer"
            >
              {linkedinUrl}
            </a>
          </li>
        )}
        {currentGrossAnnual && (
          <li>
            <strong>Current gross annual:</strong> {currentGrossAnnual}
          </li>
        )}
        {expectation && (
          <li>
            <strong>Expected gross annual:</strong> {expectation}
          </li>
        )}
        {noticePeriod && (
          <li>
            <strong>Notice period:</strong> {noticePeriod}
          </li>
        )}
      </ul>

      <p style={pStyle}>
        The full application, including CV upload and parsed profile, is
        available in the ATS.
      </p>

      <p style={pStyle}>
        Please review and route to the appropriate stage in the pipeline.
      </p>

      <p style={pStyle}>
        – ThinkATS / Resourcin
      </p>
    </ResourcinEmailLayout>
  );
}
