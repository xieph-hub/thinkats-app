// emails/ClientNewApplicationNotificationEmail.tsx
import * as React from "react";
import ResourcinEmailLayout from "./ResourcinEmailLayout";

type ClientNewApplicationNotificationEmailProps = {
  clientName?: string | null;
  jobTitle: string;
  jobLocation?: string | null;
  candidateName: string;
  candidateEmail: string;
  source?: string | null;
  atsLink?: string | null;
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
  const greetingName = clientName?.trim() || "there";
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
      previewText={`A new candidate has applied for ${jobTitle} via Resourcin.`}
      title={`New candidate for ${jobTitle}`}
      intro={`Hi ${greetingName},`}
      ctaLabel={hasAtsLink ? "View candidate in Resourcin ATS" : undefined}
      ctaUrl={hasAtsLink ? atsLink || undefined : undefined}
      footerNote="You’re receiving this email because you are listed as a contact for this search with Resourcin."
    >
      <p style={pStyle}>
        A new candidate has applied for{" "}
        <strong>{jobTitle}</strong>
        {displayLocation ? ` (${displayLocation})` : ""}.
      </p>

      <p style={pStyle}>Quick snapshot:</p>

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
      </ul>

      <p style={pStyle}>
        We will review their profile against the agreed requirements and share
        our recommendation as part of your next shortlist update.
      </p>

      <p style={pStyle}>
        If you have any immediate feedback or want us to adjust the profile
        parameters, simply reply to this email.
      </p>

      <p style={pStyle}>
        Best regards,
        <br />
        <strong>The Resourcin team</strong>
      </p>
    </ResourcinEmailLayout>
  );
}
