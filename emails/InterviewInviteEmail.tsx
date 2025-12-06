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
            {/* Header / intro */}
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

                {/* Salutation */}
                <p
                  style={{
                    margin: "10px 0 0 0",
                    fontSize: 13,
                    color: "#475569",
                  }}
                >
                  Hi {candidateName},
                </p>

                {/* Spacer / separate body paragraph */}
                <p
                  style={{
                    margin: "10px 0 0 0",
                    fontSize: 13,
                    color: "#475569",
                  }}
                >
                  Thank you for your interest in the{" "}
                  <strong>{jobTitle}</strong> role with{" "}
                  <strong>{orgLabel}</strong>. We&apos;d like to invite you to
                  an interview and have included the details below.
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
                            {/* Date & time */}
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

                            {/* Format */}
                            {interviewType && (
                              <>
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
                              </>
                            )}

                            {/* Where */}
                            {(location || videoUrl) && (
                              <>
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
                              </>
                            )}

                            {/* Organisation & organiser */}
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

            {/* Notes (optional) */}
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

            {/* How to manage / next steps */}
            <tr>
              <td style={{ padding: "0 24px 18px 24px" }}>
                <p
                  style={{
                    margin: "8px 0 8px 0",
                    fontSize: 13,
                    color: "#64748b",
                  }}
                >
                  To manage your application and interview details (for example,
                  to reschedule, update your availability or ask a question),
                  please reply directly to this email and a member of the{" "}
                  {orgLabel} recruitment team will get back to you.
                </p>

                {/* Optional: subtle link if you later point this to a candidate-facing page */}
                {dashboardUrl && (
                  <p
                    style={{
                      margin: "0 0 8px 0",
                      fontSize: 12,
                      color: "#64748b",
                    }}
                  >
                    If you were given access to an online application portal,
                    you can also view this role there:{" "}
                    <a
                      href={dashboardUrl}
                      style={{
                        color: "#1d4ed8",
                        textDecoration: "underline",
                      }}
                    >
                      open your application page
                    </a>
                    .
                  </p>
                )}
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
                  If you believe you&apos;ve received this message in error,
                  please reply to let the team at {orgLabel} know.
                </p>
                <p style={{ margin: "6px 0 0 0", fontSize: 10 }}>
                  Powered by ThinkATS.
                </p>
              </td>
            </tr>
          </tbody>
        </table>
      </body>
    </html>
  );
}
