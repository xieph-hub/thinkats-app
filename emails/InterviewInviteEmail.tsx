// emails/InterviewInviteEmail.tsx
import * as React from "react";

type Props = {
  candidateName: string;
  jobTitle: string;
  interviewDate: string;
  interviewType?: string | null;
  location?: string | null;
  videoUrl?: string | null;
  notes?: string | null;
  organiserName?: string | null;
  organisationName?: string | null;
  dashboardUrl: string;
};

export default function InterviewInviteEmail({
  candidateName,
  jobTitle,
  interviewDate,
  interviewType,
  location,
  videoUrl,
  notes,
  organiserName,
  organisationName,
  dashboardUrl,
}: Props) {
  const orgLabel = organisationName || "our team";
  const organiserLabel = organiserName || orgLabel;

  return (
    <html>
      <body
        style={{
          margin: 0,
          padding: "24px",
          backgroundColor: "#f8fafc",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
          fontSize: 14,
          color: "#0f172a",
        }}
      >
        <table
          width="100%"
          cellPadding={0}
          cellSpacing={0}
          style={{
            maxWidth: 640,
            margin: "0 auto",
            backgroundColor: "#ffffff",
            borderRadius: 12,
            border: "1px solid #e2e8f0",
          }}
        >
          <tbody>
            <tr>
              <td style={{ padding: "20px 24px 12px 24px" }}>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: 0.08,
                    color: "#64748b",
                    marginBottom: 8,
                  }}
                >
                  Interview invitation
                </div>
                <h1
                  style={{
                    margin: 0,
                    fontSize: 20,
                    fontWeight: 600,
                    color: "#020617",
                  }}
                >
                  Interview for {jobTitle}
                </h1>
                <p
                  style={{
                    margin: "8px 0 0 0",
                    fontSize: 13,
                    color: "#475569",
                  }}
                >
                  Hi {candidateName},
                </p>
                <p
                  style={{
                    margin: "4px 0 0 0",
                    fontSize: 13,
                    color: "#475569",
                  }}
                >
                  You&apos;ve been invited to interview with{" "}
                  <strong>{orgLabel}</strong> for the{" "}
                  <strong>{jobTitle}</strong> role.
                </p>
              </td>
            </tr>

            {/* Details card */}
            <tr>
              <td style={{ padding: "0 24px 16px 24px" }}>
                <table
                  width="100%"
                  cellPadding={0}
                  cellSpacing={0}
                  style={{
                    marginTop: 12,
                    borderRadius: 10,
                    border: "1px solid #e2e8f0",
                    background:
                      "linear-gradient(135deg, #0f172a 0%, #020617 55%, #111827 100%)",
                    color: "#e5e7eb",
                  }}
                >
                  <tbody>
                    <tr>
                      <td style={{ padding: "14px 16px" }}>
                        <table
                          width="100%"
                          cellPadding={0}
                          cellSpacing={0}
                        >
                          <tbody>
                            <tr>
                              <td
                                style={{
                                  fontSize: 12,
                                  fontWeight: 500,
                                  color: "#9ca3af",
                                  paddingBottom: 4,
                                }}
                              >
                                Date &amp; time
                              </td>
                            </tr>
                            <tr>
                              <td
                                style={{
                                  fontSize: 13,
                                  fontWeight: 500,
                                  paddingBottom: 10,
                                }}
                              >
                                {interviewDate}
                              </td>
                            </tr>
                            {interviewType && (
                              <tr>
                                <td
                                  style={{
                                    fontSize: 12,
                                    color: "#cbd5f5",
                                    paddingBottom: 4,
                                  }}
                                >
                                  Format
                                </td>
                              </tr>
                            )}
                            {interviewType && (
                              <tr>
                                <td
                                  style={{
                                    fontSize: 13,
                                    paddingBottom: 10,
                                  }}
                                >
                                  {interviewType}
                                </td>
                              </tr>
                            )}
                            {(location || videoUrl) && (
                              <tr>
                                <td
                                  style={{
                                    fontSize: 12,
                                    color: "#cbd5f5",
                                    paddingBottom: 4,
                                  }}
                                >
                                  Where
                                </td>
                              </tr>
                            )}
                            {(location || videoUrl) && (
                              <tr>
                                <td
                                  style={{
                                    fontSize: 13,
                                    paddingBottom: 10,
                                  }}
                                >
                                  {videoUrl ? (
                                    <a
                                      href={videoUrl}
                                      style={{
                                        color: "#bfdbfe",
                                        textDecoration: "underline",
                                      }}
                                    >
                                      Join via video link
                                    </a>
                                  ) : null}
                                  {videoUrl && location ? " · " : null}
                                  {location ? (
                                    <span>{location}</span>
                                  ) : null}
                                </td>
                              </tr>
                            )}
                            <tr>
                              <td
                                style={{
                                  fontSize: 12,
                                  color: "#9ca3af",
                                  paddingTop: 4,
                                }}
                              >
                                From {orgLabel}
                              </td>
                            </tr>
                            {organiserLabel && (
                              <tr>
                                <td
                                  style={{
                                    fontSize: 12,
                                    color: "#9ca3af",
                                  }}
                                >
                                  Coordinator: {organiserLabel}
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>

            {/* Notes */}
            {notes && (
              <tr>
                <td style={{ padding: "0 24px 16px 24px" }}>
                  <h3
                    style={{
                      margin: "8px 0 4px 0",
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#0f172a",
                    }}
                  >
                    Interview notes
                  </h3>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 13,
                      color: "#475569",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {notes}
                  </p>
                </td>
              </tr>
            )}

            {/* Dashboard link */}
            <tr>
              <td style={{ padding: "0 24px 20px 24px" }}>
                <p
                  style={{
                    margin: "8px 0 12px 0",
                    fontSize: 13,
                    color: "#64748b",
                  }}
                >
                  You can manage your application and interview details
                  directly in your ThinkATS workspace.
                </p>
                <a
                  href={dashboardUrl}
                  style={{
                    display: "inline-block",
                    padding: "8px 16px",
                    borderRadius: 999,
                    backgroundColor: "#020617",
                    color: "#f9fafb",
                    fontSize: 13,
                    fontWeight: 600,
                    textDecoration: "none",
                  }}
                >
                  View role in ThinkATS
                </a>
              </td>
            </tr>

            {/* Footer */}
            <tr>
              <td
                style={{
                  padding: "0 24px 18px 24px",
                  fontSize: 11,
                  color: "#9ca3af",
                }}
              >
                <p style={{ margin: 0 }}>
                  If you need to reschedule, reply to this email and the
                  coordinator at {orgLabel} will follow up.
                </p>
              </td>
            </tr>
          </tbody>
        </table>
      </body>
    </html>
  );
}
