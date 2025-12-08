// emails/ThinkATSEmailLayout.tsx
import * as React from "react";

export interface ThinkATSEmailLayoutProps {
  title: string;
  children: React.ReactNode;
  /** New name */
  previewText?: string;
  /** Backwards-compatible alias if you ever pass preheader */
  preheader?: string;
}

const brandBlue = "#172965";
const brandYellow = "#FFC000";

export default function ThinkATSEmailLayout({
  title,
  previewText,
  preheader,
  children,
}: ThinkATSEmailLayoutProps) {
  // Use previewText if provided, otherwise fall back to preheader
  const effectivePreview = previewText ?? preheader ?? "";

  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <title>{title}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body
        style={{
          margin: 0,
          padding: 0,
          backgroundColor: "#f3f4f6",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
          color: "#111827",
        }}
      >
        {/* Inbox preview text (hidden in the email body) */}
        {effectivePreview && (
          <div
            style={{
              display: "none",
              overflow: "hidden",
              lineHeight: "1px",
              maxHeight: 0,
              maxWidth: 0,
              opacity: 0,
            }}
          >
            {effectivePreview}
          </div>
        )}

        <table
          width="100%"
          cellPadding={0}
          cellSpacing={0}
          role="presentation"
          style={{ padding: "24px 0" }}
        >
          <tbody>
            <tr>
              <td align="center">
                {/* Outer card */}
                <table
                  width="100%"
                  cellPadding={0}
                  cellSpacing={0}
                  role="presentation"
                  style={{
                    maxWidth: "640px",
                    width: "100%",
                    backgroundColor: "#ffffff",
                    borderRadius: "16px",
                    border: "1px solid #e5e7eb",
                    overflow: "hidden",
                    boxShadow:
                      "0 10px 25px rgba(15, 23, 42, 0.04), 0 4px 8px rgba(15,23,42,0.04)",
                  }}
                >
                  <tbody>
                    {/* Top accent bar */}
                    <tr>
                      <td
                        style={{
                          height: "4px",
                          background:
                            "linear-gradient(90deg, #172965 0%, #306B34 55%, #FFC000 100%)",
                        }}
                      />
                    </tr>

                    {/* Header */}
                    <tr>
                      <td style={{ padding: "20px 24px 8px 24px" }}>
                        <div
                          style={{
                            fontSize: "11px",
                            letterSpacing: "0.16em",
                            textTransform: "uppercase",
                            fontWeight: 700,
                            color: "#6b7280",
                          }}
                        >
                          THINKATS
                        </div>
                        <div
                          style={{
                            marginTop: "6px",
                            fontSize: "20px",
                            lineHeight: 1.3,
                            fontWeight: 700,
                            color: "#111827",
                          }}
                        >
                          {title}
                        </div>
                        <div
                          style={{
                            marginTop: "4px",
                            fontSize: "12px",
                            color: "#6b7280",
                          }}
                        >
                          Modern applicant tracking &amp; careers sites for
                          growing teams.
                        </div>
                      </td>
                    </tr>

                    {/* Body content */}
                    <tr>
                      <td style={{ padding: "4px 24px 20px 24px" }}>
                        {children}
                      </td>
                    </tr>

                    {/* Footer */}
                    <tr>
                      <td
                        style={{
                          padding: "14px 24px 18px 24px",
                          borderTop: "1px solid #e5e7eb",
                          backgroundColor: "#f9fafb",
                        }}
                      >
                        {/* Tagline */}
                        <div
                          style={{
                            fontSize: "12px",
                            color: "#4b5563",
                            marginBottom: "6px",
                          }}
                        >
                          <strong style={{ color: brandBlue }}>
                            ThinkATS
                          </strong>{" "}
                          · Hiring infrastructure for modern teams.
                        </div>

                        {/* Website + email (clickable text) */}
                        <div
                          style={{
                            fontSize: "12px",
                            color: "#4b5563",
                            marginBottom: "10px",
                          }}
                        >
                          <a
                            href="https://www.thinkats.com"
                            style={{
                              color: brandBlue,
                              textDecoration: "none",
                              fontWeight: 500,
                              marginRight: "10px",
                            }}
                          >
                            thinkats.com
                          </a>
                          <span style={{ marginRight: "8px", color: "#9ca3af" }}>
                            ·
                          </span>
                          <a
                            href="mailto:hello@thinkats.com"
                            style={{
                              color: brandBlue,
                              textDecoration: "none",
                              fontWeight: 500,
                            }}
                          >
                            hello@thinkats.com
                          </a>
                        </div>

                        {/* Icon row – LinkedIn, X, Globe, Envelope */}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            flexWrap: "wrap",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "11px",
                              color: "#6b7280",
                              marginRight: "4px",
                            }}
                          >
                            Connect:
                          </span>

                          {/* LinkedIn */}
                          <a
                            href="https://www.linkedin.com/company/thinkats"
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              width: "28px",
                              height: "28px",
                              borderRadius: "9999px",
                              backgroundColor: "#ffffff",
                              border: "1px solid #e5e7eb",
                              textDecoration: "none",
                            }}
                          >
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              aria-hidden="true"
                              role="img"
                            >
                              <path
                                fill="#0A66C2"
                                d="M4.98 3.5C4.98 4.88 3.88 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1 4.98 2.12 4.98 3.5zM.22 8.25h4.56V24H.22zM8.34 8.25h4.37v2.13h.06c.61-1.16 2.1-2.38 4.32-2.38 4.62 0 5.47 3.04 5.47 6.99V24h-4.56v-7.22c0-1.72-.03-3.93-2.4-3.93-2.4 0-2.77 1.87-2.77 3.8V24H8.34z"
                              />
                            </svg>
                          </a>

                          {/* X */}
                          <a
                            href="https://x.com/thinkats"
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              width: "28px",
                              height: "28px",
                              borderRadius: "9999px",
                              backgroundColor: "#ffffff",
                              border: "1px solid #e5e7eb",
                              textDecoration: "none",
                            }}
                          >
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              aria-hidden="true"
                              role="img"
                            >
                              <path
                                fill="#000000"
                                d="M18.5 2h-3.1L12 7.2 8.8 2H2l6.7 10.1L2.4 22h3.1L12 14.7 16 22h6.8l-7-10.6L21.6 2h-3.1L14 8.4z"
                              />
                            </svg>
                          </a>

                          {/* Website (globe) */}
                          <a
                            href="https://www.thinkats.com"
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              width: "28px",
                              height: "28px",
                              borderRadius: "9999px",
                              backgroundColor: "#ffffff",
                              border: "1px solid #e5e7eb",
                              textDecoration: "none",
                            }}
                          >
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 20 20"
                              aria-hidden="true"
                              role="img"
                            >
                              <circle
                                cx="10"
                                cy="10"
                                r="6.2"
                                stroke={brandBlue}
                                strokeWidth="1.2"
                                fill="none"
                              />
                              <path
                                d="M10 3.8c-1.5 1.7-2.3 3.9-2.3 6.2 0 2.3.8 4.5 2.3 6.2m0-12.4c1.5 1.7 2.3 3.9 2.3 6.2 0 2.3-.8 4.5-2.3 6.2M4.2 10h11.6"
                                stroke={brandBlue}
                                strokeWidth="1.1"
                                fill="none"
                              />
                            </svg>
                          </a>

                          {/* Email (envelope) */}
                          <a
                            href="mailto:hello@thinkats.com"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              width: "28px",
                              height: "28px",
                              borderRadius: "9999px",
                              backgroundColor: "#ffffff",
                              border: "1px solid #e5e7eb",
                              textDecoration: "none",
                            }}
                          >
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              aria-hidden="true"
                              role="img"
                            >
                              <rect
                                x="3"
                                y="5"
                                width="18"
                                height="14"
                                rx="2"
                                ry="2"
                                fill="none"
                                stroke={brandBlue}
                                strokeWidth="1.4"
                              />
                              <path
                                d="M4.5 7l7.5 5 7.5-5"
                                fill="none"
                                stroke={brandBlue}
                                strokeWidth="1.4"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </a>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Tiny legal / system line */}
                <div
                  style={{
                    marginTop: "10px",
                    fontSize: "10px",
                    color: "#9ca3af",
                  }}
                >
                  You’re receiving this email because you interacted with a role
                  managed via ThinkATS.
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </body>
    </html>
  );
}
