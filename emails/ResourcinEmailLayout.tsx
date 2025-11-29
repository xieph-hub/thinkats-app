// emails/ResourcinEmailLayout.tsx
import * as React from "react";

type ResourcinEmailLayoutProps = {
  /** Shown in inbox preview, mostly hidden in the body */
  previewText?: string;
  /** Main email title/heading */
  title: string;
  /** Optional greeting / intro line, e.g. "Hi Victor," */
  intro?: string;
  /** Main body content (paragraphs, lists, etc.) */
  children?: React.ReactNode;
  /** Optional primary CTA button */
  ctaLabel?: string;
  ctaUrl?: string;
  /** Small line above footer (e.g. "You’re receiving this because…") */
  footerNote?: string;
};

const brandBlue = "#172965";
const brandDark = "#0B1320";
const brandGreen = "#64C247";

export default function ResourcinEmailLayout({
  previewText,
  title,
  intro,
  children,
  ctaLabel,
  ctaUrl,
  footerNote,
}: ResourcinEmailLayoutProps) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <title>{title}</title>
      </head>
      <body style={bodyStyle}>
        {/* Preheader (hidden in body, visible in inbox preview) */}
        {previewText && (
          <div style={preheaderStyle}>
            {previewText}
          </div>
        )}

        <table width="100%" cellPadding={0} cellSpacing={0} style={outerTable}>
          <tbody>
            <tr>
              <td align="center" style={{ padding: "24px 16px" }}>
                {/* Card wrapper */}
                <table
                  width="100%"
                  cellPadding={0}
                  cellSpacing={0}
                  style={card}
                >
                  <tbody>
                    {/* Header / brand bar */}
                    <tr>
                      <td style={header}>
                        <div style={logoText}>
                          Resourcin
                        </div>
                        <div style={tagline}>
                          Search, selection & recruitment
                        </div>
                      </td>
                    </tr>

                    {/* Main content */}
                    <tr>
                      <td style={content}>
                        <h1 style={h1}>{title}</h1>
                        {intro && (
                          <p style={p}>
                            {intro}
                          </p>
                        )}

                        {children}

                        {ctaLabel && ctaUrl && (
                          <div style={{ marginTop: "24px" }}>
                            <a
                              href={ctaUrl}
                              style={button}
                              target="_blank"
                              rel="noreferrer"
                            >
                              {ctaLabel}
                            </a>
                          </div>
                        )}
                      </td>
                    </tr>

                    {/* Footer */}
                    <tr>
                      <td style={footer}>
                        {footerNote && (
                          <p style={footerNoteStyle}>
                            {footerNote}
                          </p>
                        )}

                        <p style={footerMain}>
                          Resourcin · Talent advisory & recruitment
                          <br />
                          <a
                            href="https://www.resourcin.com"
                            style={footerLink}
                            target="_blank"
                            rel="noreferrer"
                          >
                            resourcin.com
                          </a>
                        </p>

                        <p style={footerSocial}>
                          Follow us:
                          {" "}
                          <a
                            href="https://www.linkedin.com/company/resourcin"
                            style={footerLink}
                            target="_blank"
                            rel="noreferrer"
                          >
                            LinkedIn
                          </a>
                          {" · "}
                          <a
                            href="https://x.com/resourcinhq"
                            style={footerLink}
                            target="_blank"
                            rel="noreferrer"
                          >
                            X
                          </a>
                          {" · "}
                          <a
                            href="https://www.instagram.com/resourcinhq/"
                            style={footerLink}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Instagram
                          </a>
                        </p>

                        <p style={footerSmall}>
                          © {new Date().getFullYear()} Resourcin. All rights
                          reserved.
                        </p>
                      </td>
                    </tr>
                  </tbody>
                </table>

              </td>
            </tr>
          </tbody>
        </table>
      </body>
    </html>
  );
}

// --------- STYLES (inline-friendly, email-safe) -------------------

const bodyStyle: React.CSSProperties = {
  margin: 0,
  padding: 0,
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  backgroundColor: "#F3F4F6",
  color: "#0F172A",
};

const preheaderStyle: React.CSSProperties = {
  display: "none",
  fontSize: "1px",
  color: "#F3F4F6",
  lineHeight: "1px",
  maxHeight: "0px",
  maxWidth: "0px",
  opacity: 0,
  overflow: "hidden",
};

const outerTable: React.CSSProperties = {
  maxWidth: "640px",
  margin: "0 auto",
};

const card: React.CSSProperties = {
  width: "100%",
  backgroundColor: "#FFFFFF",
  borderRadius: "12px",
  overflow: "hidden",
  border: "1px solid #E5E7EB",
};

const header: React.CSSProperties = {
  padding: "16px 24px",
  borderBottom: "1px solid #E5E7EB",
  background:
    "linear-gradient(135deg, #0B1320 0%, #172965 55%, #64C247 100%)",
};

const logoText: React.CSSProperties = {
  fontSize: "20px",
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "#FFFFFF",
};

const tagline: React.CSSProperties = {
  marginTop: "4px",
  fontSize: "11px",
  color: "rgba(255,255,255,0.85)",
};

const content: React.CSSProperties = {
  padding: "24px",
};

const h1: React.CSSProperties = {
  fontSize: "18px",
  lineHeight: "1.4",
  margin: "0 0 12px 0",
  color: brandBlue,
};

const p: React.CSSProperties = {
  fontSize: "13px",
  lineHeight: "1.6",
  margin: "0 0 12px 0",
  color: "#111827",
};

const button: React.CSSProperties = {
  display: "inline-block",
  padding: "10px 18px",
  borderRadius: "999px",
  backgroundColor: brandDark,
  color: "#FFFFFF",
  fontSize: "13px",
  fontWeight: 600,
  textDecoration: "none",
};

const footer: React.CSSProperties = {
  padding: "16px 24px 20px",
  borderTop: "1px solid #E5E7EB",
  backgroundColor: "#F9FAFB",
};

const footerNoteStyle: React.CSSProperties = {
  margin: "0 0 8px 0",
  fontSize: "11px",
  lineHeight: "1.5",
  color: "#6B7280",
};

const footerMain: React.CSSProperties = {
  margin: "0 0 6px 0",
  fontSize: "11px",
  lineHeight: "1.5",
  color: "#4B5563",
};

const footerSocial: React.CSSProperties = {
  margin: "0 0 4px 0",
  fontSize: "11px",
  color: "#4B5563",
};

const footerSmall: React.CSSProperties = {
  margin: 0,
  fontSize: "10px",
  color: "#9CA3AF",
};

const footerLink: React.CSSProperties = {
  color: brandBlue,
  textDecoration: "underline",
};
