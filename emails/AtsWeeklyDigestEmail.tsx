// emails/AtsWeeklyDigestEmail.tsx
import * as React from "react";

export type AtsWeeklyDigestJobStat = {
  jobId: string;
  jobTitle: string;
  newApplications: number;
};

export type AtsWeeklyDigestEmailProps = {
  tenantName: string;
  weekRangeLabel: string;
  totalNewApplications: number;
  totalNewCandidates: number;
  totalOpenJobs: number;
  perJobStats: AtsWeeklyDigestJobStat[];
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
  maxWidth: 640,
  margin: "0 auto",
  backgroundColor: "#ffffff",
  borderRadius: 12,
  padding: 20,
  border: "1px solid #e2e8f0",
};

export default function AtsWeeklyDigestEmail(
  props: AtsWeeklyDigestEmailProps,
) {
  const {
    tenantName,
    weekRangeLabel,
    totalNewApplications,
    totalNewCandidates,
    totalOpenJobs,
    perJobStats,
    dashboardUrl,
  } = props;

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <p
          style={{
            fontSize: 11,
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            color: "#64748b",
            marginBottom: 8,
          }}
        >
          ThinkATS · Weekly digest
        </p>

        <h1
          style={{
            fontSize: 18,
            fontWeight: 600,
            marginBottom: 4,
          }}
        >
          {tenantName} – activity for {weekRangeLabel}
        </h1>

        <p style={{ fontSize: 14, marginBottom: 16, lineHeight: 1.6 }}>
          Here is a summary of hiring activity across your ThinkATS workspace in
          the last week.
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
                <strong>{totalNewApplications}</strong> new applications
              </td>
            </tr>
            <tr>
              <td style={{ padding: "6px 0" }}>
                <strong>{totalNewCandidates}</strong> new candidates added to
                your talent pool
              </td>
            </tr>
            <tr>
              <td style={{ padding: "6px 0" }}>
                <strong>{totalOpenJobs}</strong> open jobs
              </td>
            </tr>
          </tbody>
        </table>

        {perJobStats.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <p
              style={{
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 8,
              }}
            >
              Applications by role
            </p>
            <table
              width="100%"
              cellPadding={0}
              cellSpacing={0}
              style={{ fontSize: 13, borderCollapse: "collapse" }}
            >
              <thead>
                <tr>
                  <th
                    align="left"
                    style={{
                      padding: "6px 0",
                      borderBottom: "1px solid #e2e8f0",
                    }}
                  >
                    Role
                  </th>
                  <th
                    align="right"
                    style={{
                      padding: "6px 0",
                      borderBottom: "1px solid #e2e8f0",
                    }}
                  >
                    New applications
                  </th>
                </tr>
              </thead>
              <tbody>
                {perJobStats.map((job) => (
                  <tr key={job.jobId}>
                    <td
                      style={{
                        padding: "6px 0",
                        borderBottom: "1px solid #f1f5f9",
                      }}
                    >
                      {job.jobTitle}
                    </td>
                    <td
                      align="right"
                      style={{
                        padding: "6px 0",
                        borderBottom: "1px solid #f1f5f9",
                      }}
                    >
                      {job.newApplications}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {dashboardUrl && (
          <p style={{ fontSize: 13, marginTop: 16 }}>
            View details and pipelines in your{" "}
            <a href={dashboardUrl} target="_blank" rel="noreferrer">
              ThinkATS dashboard
            </a>
            .
          </p>
        )}

        <p style={{ fontSize: 12, marginTop: 18, color: "#64748b" }}>
          You are receiving this email because weekly ATS digests are enabled
          for this workspace.
        </p>
      </div>
    </div>
  );
}
