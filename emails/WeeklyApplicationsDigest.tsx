// emails/WeeklyApplicationsDigest.tsx
import * as React from "react";

type ApplicationSummary = {
  candidateName: string;
  candidateEmail: string;
  location?: string | null;
  createdAt: string;
  source?: string | null;
};

type JobGroup = {
  jobTitle: string;
  jobLocation?: string | null;
  tenantName?: string | null;
  clientName?: string | null;
  jobPublicUrl: string;
  atsJobUrl: string;
  applications: ApplicationSummary[];
};

export type WeeklyApplicationsDigestProps = {
  periodLabel: string;
  totalApplications: number;
  jobGroups: JobGroup[];
};

export default function WeeklyApplicationsDigest({
  periodLabel,
  totalApplications,
  jobGroups,
}: WeeklyApplicationsDigestProps) {
  return (
    <div
      style={{
        fontFamily:
          "-apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif",
        fontSize: 14,
        color: "#111827",
        lineHeight: 1.5,
      }}
    >
      <h1 style={{ fontSize: 20, marginBottom: 4 }}>
        Weekly applications digest
      </h1>
      <p style={{ margin: 0, color: "#6B7280" }}>{periodLabel}</p>
      <p style={{ marginTop: 12 }}>
        <strong>{totalApplications}</strong>{" "}
        {totalApplications === 1 ? "new application" : "new applications"} this
        period.
      </p>

      {jobGroups.length === 0 ? (
        <p style={{ marginTop: 16, color: "#6B7280" }}>
          No applications received in this period.
        </p>
      ) : (
        jobGroups.map((job) => (
          <div
            key={job.jobPublicUrl}
            style={{
              border: "1px solid #E5E7EB",
              borderRadius: 8,
              padding: 12,
              marginTop: 16,
            }}
          >
            <div style={{ marginBottom: 4 }}>
              <a
                href={job.jobPublicUrl}
                style={{ fontSize: 15, fontWeight: 600, color: "#111827" }}
              >
                {job.jobTitle}
              </a>
              {job.jobLocation && (
                <span style={{ marginLeft: 6, color: "#6B7280" }}>
                  · {job.jobLocation}
                </span>
              )}
            </div>
            <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 8 }}>
              {job.clientName || job.tenantName ? (
                <>
                  {job.clientName && <span>{job.clientName}</span>}
                  {job.clientName && job.tenantName && (
                    <span style={{ margin: "0 4px" }}>·</span>
                  )}
                  {job.tenantName && <span>via {job.tenantName}</span>}
                </>
              ) : (
                <span>Hiring company</span>
              )}
            </div>

            <div style={{ fontSize: 12, marginBottom: 4 }}>
              <a
                href={job.atsJobUrl}
                style={{ color: "#1D4ED8", textDecoration: "none" }}
              >
                Open in ATS
              </a>
            </div>

            <table
              cellPadding={4}
              style={{
                width: "100%",
                borderCollapse: "collapse",
                marginTop: 8,
                fontSize: 12,
              }}
            >
              <thead>
                <tr>
                  <th
                    align="left"
                    style={{ borderBottom: "1px solid #E5E7EB", padding: 4 }}
                  >
                    Candidate
                  </th>
                  <th
                    align="left"
                    style={{ borderBottom: "1px solid #E5E7EB", padding: 4 }}
                  >
                    Email
                  </th>
                  <th
                    align="left"
                    style={{ borderBottom: "1px solid #E5E7EB", padding: 4 }}
                  >
                    Location
                  </th>
                  <th
                    align="left"
                    style={{ borderBottom: "1px solid #E5E7EB", padding: 4 }}
                  >
                    Source
                  </th>
                  <th
                    align="left"
                    style={{ borderBottom: "1px solid #E5E7EB", padding: 4 }}
                  >
                    Applied at
                  </th>
                </tr>
              </thead>
              <tbody>
                {job.applications.map((app, idx) => (
                  <tr key={`${app.candidateEmail}-${idx}`}>
                    <td style={{ padding: 4 }}>{app.candidateName}</td>
                    <td style={{ padding: 4 }}>{app.candidateEmail}</td>
                    <td style={{ padding: 4 }}>
                      {app.location || <span style={{ color: "#9CA3AF" }}>—</span>}
                    </td>
                    <td style={{ padding: 4 }}>
                      {app.source || <span style={{ color: "#9CA3AF" }}>—</span>}
                    </td>
                    <td style={{ padding: 4, whiteSpace: "nowrap" }}>
                      {app.createdAt}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))
      )}

      <p style={{ marginTop: 24, fontSize: 11, color: "#9CA3AF" }}>
        This email is generated automatically from ThinkATS. For more detail,
        sign in to your ATS workspace.
      </p>
    </div>
  );
}
