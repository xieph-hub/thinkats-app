// emails/InternalNewApplicationNotificationEmail.tsx
import * as React from "react";
import ResourcinEmailLayout from "./ResourcinEmailLayout";

export type InternalNewApplicationNotificationEmailProps = {
  jobTitle: string;
  jobLocation: string | null;
  candidateName: string;
  candidateEmail: string;
  source: string;
  atsLink: string;
  linkedinUrl?: string;
  currentGrossAnnual?: string;
  expectation?: string;
  noticePeriod?: string;
  cvUrl?: string;
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
  cvUrl,
}: InternalNewApplicationNotificationEmailProps) {
  return (
    <ResourcinEmailLayout
      title="New application received"
      previewText={`${candidateName} just applied for ${jobTitle}.`}
    >
      <p style={{ margin: "0 0 10px 0" }}>
        A new application has been submitted via the Resourcin ATS.
      </p>

      <div
        style={{
          marginTop: "8px",
          padding: "12px 14px",
          borderRadius: "10px",
          backgroundColor: "#f9fafb",
          border: "1px solid #e5e7eb",
          fontSize: "13px",
          color: "#4b5563",
        }}
      >
        <div style={{ marginBottom: "4px" }}>
          <strong>Candidate:</strong> {candidateName} ({candidateEmail})
        </div>
        {linkedinUrl ? (
          <div style={{ marginBottom: "4px" }}>
            <strong>LinkedIn:</strong>{" "}
            <a
              href={linkedinUrl}
              style={{ color: "#172965", textDecoration: "none" }}
            >
              {linkedinUrl}
            </a>
          </div>
        ) : null}
        <div style={{ marginBottom: "4px" }}>
          <strong>Role:</strong> {jobTitle}
          {jobLocation ? ` – ${jobLocation}` : ""}
        </div>
        {currentGrossAnnual ? (
          <div style={{ marginBottom: "2px" }}>
            <strong>Current gross annual:</strong> {currentGrossAnnual}
          </div>
        ) : null}
        {expectation ? (
          <div style={{ marginBottom: "2px" }}>
            <strong>Expected gross annual:</strong> {expectation}
          </div>
        ) : null}
        {noticePeriod ? (
          <div style={{ marginBottom: "2px" }}>
            <strong>Notice period:</strong> {noticePeriod}
          </div>
        ) : null}
        {source ? (
          <div style={{ marginBottom: "2px" }}>
            <strong>Source:</strong> {source}
          </div>
        ) : null}
        {cvUrl ? (
          <div>
            <strong>CV:</strong>{" "}
            <a
              href={cvUrl}
              style={{ color: "#172965", textDecoration: "none" }}
            >
              View CV
            </a>
          </div>
        ) : null}
      </div>

      <p style={{ marginTop: "14px", marginBottom: 0, fontSize: "13px" }}>
        <strong>ATS links</strong>
        <br />
        <a
          href={atsLink}
          style={{ color: "#172965", textDecoration: "none" }}
        >
          Open job &amp; pipeline in ATS
        </a>
      </p>
    </ResourcinEmailLayout>
  );
}
