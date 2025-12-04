// emails/InterviewInviteEmail.tsx
import * as React from "react";

export type InterviewInviteEmailProps = {
  candidateName: string;
  jobTitle: string;
  interviewDate: string;
  interviewType?: string | null;
  location?: string | null;
  videoUrl?: string | null;
  notes?: string | null;
  organiserName?: string | null;
  dashboardUrl?: string | null;
};

const containerStyle: React.CSSProperties = {
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  fontSize: 14,
  color: "#0f172a",
  backgroundColor: "#f8fafc",
  padding: "24px 16px",
};

const cardStyle: React.CSSProperties = {
  maxWidth: 600,
  margin: "0 auto",
  backgroundColor: "#ffffff",
  borderRadius: 12,
  padding: 20,
  border: "1px solid #e2e8f0",
};

const headingStyle: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 600,
  marginBottom: 8,
};

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  color: "#64748b",
};

const valueStyle: React.CSSProperties = {
  fontSize: 14,
  color: "#0f172a",
};

export default function InterviewInviteEmail(
  props: InterviewInviteEmailProps,
) {
  const {
    candidateName,
    jobTitle,
    interviewDate,
    interviewType,
    location,
    videoUrl,
    notes,
    organiserName,
    dashboardUrl,
  } = props;

  const organiserLabel = organiserName || "ThinkATS recruitment team";

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <p style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>
          From {organiserLabel}
        </p>

        <h1 style={headingStyle}>
          Interview scheduled for {jobTitle}
        </h1>

        <p style={{ fontSize: 14, marginBottom: 12 }}>
          Hi {candidateName},
        </p>

        <p style={{ fontSize: 14, marginBottom: 16, lineHeight: 1.6 }}>
          This is a confirmation that your interview has been scheduled for{" "}
          <strong>{jobTitle}</strong>. The details are below.
        </p>

        <table
          width="100%"
          cellPadding={0}
          cellSpacing={0}
          style={{ marginBottom: 16 }}
        >
          <tbody>
            <tr>
              <td style={{ padding: "6px 0" }}>
                <div style={labelStyle}>Date &amp; time</div>
                <div style={valueStyle}>{interviewDate}</div>
              </td>
            </tr>

            {interviewType && (
              <tr>
                <td style={{ padding: "6px 0" }}>
                  <div style={labelStyle}>Format</div>
                  <div style={valueStyle}>{interviewType}</div>
                </td>
              </tr>
            )}

            {location && (
              <tr>
                <td style={{ padding: "6px 0" }}>
                  <div style={labelStyle}>Location</div>
                  <div style={valueStyle}>{location}</div>
                </td>
              </tr>
            )}

            {videoUrl && (
              <tr>
                <td style={{ padding: "6px 0" }}>
                  <div style={labelStyle}>Video link</div>
                  <div style={valueStyle}>
                    <a href={videoUrl} target="_blank" rel="noreferrer">
                      Join interview
                    </a>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {notes && (
          <div style={{ marginBottom: 16 }}>
            <div style={labelStyle}>Notes</div>
            <p style={{ ...valueStyle, marginTop: 4, whiteSpace: "pre-line" }}>
              {notes}
            </p>
          </div>
        )}

        {dashboardUrl && (
          <p style={{ fontSize: 13, marginTop: 12 }}>
            You can track this process from your{" "}
            <a href={dashboardUrl} target="_blank" rel="noreferrer">
              ThinkATS portal
            </a>
            .
          </p>
        )}

        <p style={{ fontSize: 13, marginTop: 16 }}>
          If you need to reschedule, please reply to this email as soon as
          possible.
        </p>

        <p style={{ fontSize: 13, marginTop: 16 }}>
          Best regards,
          <br />
          {organiserLabel}
        </p>
      </div>
    </div>
  );
}
