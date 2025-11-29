// emails/ClientNewApplicationNotificationEmail.tsx
import * as React from "react";
import ResourcinEmailLayout from "./ResourcinEmailLayout";

export type ClientNewApplicationNotificationEmailProps = {
  clientName: string | null;
  jobTitle: string;
  jobLocation: string | null;
  candidateName: string;
  candidateEmail: string;
  source: string;
  atsLink: string;
};

export default function ClientNewApplicationNotificationEmail({
  clientName,
  jobTitle,
  jobLocation,
  candidateName,
  candidateEmail,
  source,
  atsLink,
}: ClientNewApplicationNotificationEmailProps) {
  const salutation = clientName ? `Hi ${clientName},` : "Hello,";

  return (
    <ResourcinEmailLayout
      title="New candidate for your role"
      previewText={`${candidateName} has applied for ${jobTitle}.`}
    >
      <p style={{ margin: "0 0 12px 0" }}>{salutation}</p>

      <p style={{ margin: "0 0 12px 0" }}>
        You have a new candidate for the{" "}
        <strong>
          {jobTitle}
          {jobLocation ? ` – ${jobLocation}` : ""}
        </strong>{" "}
        role being managed by Resourcin.
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
        <div style={{ marginBottom: "4px" }}>
          <strong>Role:</strong> {jobTitle}
          {jobLocation ? ` – ${jobLocation}` : ""}
        </div>
        {source ? (
          <div>
            <strong>Source:</strong> {source}
          </div>
        ) : null}
      </div>

      <p style={{ marginTop: "14px", marginBottom: 0, fontSize: "13px" }}>
        You can review this candidate and others for the role via your Resourcin
        ATS view:
        <br />
        <a
          href={atsLink}
          style={{ color: "#172965", textDecoration: "none" }}
        >
          Open pipeline in ATS
        </a>
      </p>
    </ResourcinEmailLayout>
  );
}
