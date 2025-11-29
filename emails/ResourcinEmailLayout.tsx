// emails/ResourcinEmailLayout.tsx
import * as React from "react";

export type ResourcinEmailLayoutProps = {
  title: string;
  previewText?: string;
  children: React.ReactNode;
};

export default function ResourcinEmailLayout({
  title,
  previewText,
  children,
}: ResourcinEmailLayoutProps) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <title>{title}</title>
      </head>
      <body
        style={{
          margin: 0,
          padding: 0,
          backgroundColor: "#f3f4f6",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
        }}
      >
        {/* Hidden pre-header text for email clients */}
        {previewText ? (
          <div
            style={{
              display: "none",
              overflow: "hidden",
              lineHeight: "1px",
              opacity: 0,
              maxHeight: 0,
              maxWidth: 0,
            }}
          >
            {previewText}
          </div>
        ) : null}

        <div style={{ padding: "24px 0" }}>
          <div
            style={{
              maxWidth: "640px",
              margin: "0 auto",
              padding: "0 16px",
              boxSizing: "border-box",
            }}
          >
            {/* Accent strip */}
            <div
              style={{
                height: "4px",
                borderRadius: "999px",
                background:
                  "linear-gradient(90deg, #172965, #0B1320, #4B73C9)",
                marginBottom: "12px",
              }}
            />

            {/* Card */}
            <div
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "16px",
                border: "1px solid #e5e7eb",
                padding: "24px 24px 20px",
                boxSizing: "border-box",
              }}
            >
              {/* Header */}
              <div style={{ marginBottom: "16px" }}>
                <div
                  style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    color: "#6b7280",
                  }}
                >
                  RESOURCIN
                </div>
                <h1
                  style={{
                    margin: "4px 0 0 0",
                    fontSize: "20px",
                    lineHeight: 1.3,
                    fontWeight: 700,
                    color: "#111827",
                  }}
                >
                  {title}
                </h1>
                <p
                  style={{
                    margin: "6px 0 0 0",
                    fontSize: "12px",
                    color: "#6b7280",
                  }}
                >
                  Executive search &amp; recruitment for founders, leaders and
                  hiring managers.
                </p>
              </div>

              {/* Body content */}
              <div
                style={{
                  marginTop: "8px",
                  fontSize: "14px",
                  lineHeight: 1.6,
                  color: "#374151",
                }}
              >
                {children}
              </div>
            </div>

            {/* FOOTER / SIGNATURE */}
            <div
              style={{
                marginTop: "14px",
                paddingTop: "10px",
                borderTop: "1px solid #e5e7eb",
                fontSize: "11px",
                color: "#6b7280",
              }}
            >
              {/* Top row: brand + contact */}
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  rowGap: "8px",
                }}
              >
                {/* Brand block */}
                <div style={{ minWidth: "200px" }}>
                  <div
                    style={{
                      fontWeight: 600,
                      color: "#111827",
                      fontSize: "12px",
                    }}
                  >
                    Resourcin
                  </div>
                  <div style={{ marginTop: "2px" }}>
                    Executive search &amp; recruitment
                  </div>
                  <div style={{ marginTop: "4px" }}>
                    18b Engineer Muali Subair Street, Lekki, Lagos
                  </div>
                </div>

                {/* Contact + website */}
                <div
                  style={{
                    minWidth: "200px",
                    textAlign: "right",
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 500 }}>Email:</span>{" "}
                    <a
                      href="mailto:hello@resourcin.com"
                      style={{
                        color: "#172965",
                        textDecoration: "none",
                      }}
                    >
                      hello@resourcin.com
                    </a>
                  </div>
                  <div style={{ marginTop: "4px" }}>
                    <a
                      href="https://www.resourcin.com"
                      style={{
                        color: "#172965",
                        textDecoration: "none",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <WebsiteIcon />
                      <span>resourcin.com</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* Social row */}
              <div
                style={{
                  marginTop: "10px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  rowGap: "6px",
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <span>Follow us</span>
                </div>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <SocialIconLink
                    href="https://www.linkedin.com/company/resourcin"
                    label="LinkedIn"
                  >
                    <LinkedInIcon />
                  </SocialIconLink>

                  <SocialIconLink
                    href="https://x.com/resourcinhq"
                    label="X (Twitter)"
                  >
                    <XIcon />
                  </SocialIconLink>

                  <SocialIconLink
                    href="https://www.instagram.com/resourcinhq/"
                    label="Instagram"
                  >
                    <InstagramIcon />
                  </SocialIconLink>
                </div>
              </div>

              {/* Tiny legal line */}
              <div
                style={{
                  marginTop: "8px",
                  fontSize: "10px",
                  color: "#9ca3af",
                }}
              >
                This email was sent from Resourcin&apos;s recruitment platform.
                If you believe you received it in error, please disregard.
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}

/**
 * Small circular social icon wrapper
 */
function SocialIconLink(props: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={props.href}
      aria-label={props.label}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: "28px",
        height: "28px",
        borderRadius: "999px",
        border: "1px solid #e5e7eb",
        backgroundColor: "#ffffff",
        textDecoration: "none",
      }}
    >
      {props.children}
    </a>
  );
}

/**
 * Simple "link / website" icon
 * (subtle, matches your /jobs icon aesthetic)
 */
function WebsiteIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="10" cy="10" r="6.5" stroke="#172965" strokeWidth="1.2" />
      <path
        d="M10 3.5c-2.2 2-3.3 4.1-3.3 6.5 0 2.4 1.1 4.6 3.3 6.5 2.2-1.9 3.3-4.1 3.3-6.5C13.3 7.6 12.2 5.5 10 3.5Z"
        stroke="#172965"
        strokeWidth="1.1"
      />
      <path
        d="M4 10h12"
        stroke="#172965"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * LinkedIn icon – same path as your /jobs page
 */
function LinkedInIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="#0A66C2"
      aria-hidden="true"
    >
      <path d="M4.98 3.5C4.98 4.88 3.88 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1 4.98 2.12 4.98 3.5zM.22 8.25h4.56V24H.22zM8.34 8.25h4.37v2.13h.06c.61-1.16 2.1-2.38 4.32-2.38 4.62 0 5.47 3.04 5.47 6.99V24h-4.56v-7.22c0-1.72-.03-3.93-2.4-3.93-2.4 0-2.77 1.87-2.77 3.8V24H8.34z" />
    </svg>
  );
}

/**
 * X (Twitter) icon – same shape as on /jobs
 */
function XIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="#000000"
      aria-hidden="true"
    >
      <path d="M18.5 2h-3.1L12 7.2 8.8 2H2l6.7 10.1L2.4 22h3.1L12 14.7 16 22h6.8l-7-10.6L21.6 2h-3.1L14 8.4z" />
    </svg>
  );
}

/**
 * Simple Instagram-style glyph (rounded square + circle)
 */
function InstagramIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="none"
    >
      <rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="5"
        stroke="#C13584"
        strokeWidth="1.6"
      />
      <circle cx="12" cy="12" r="4.2" stroke="#C13584" strokeWidth="1.6" />
      <circle cx="17.3" cy="6.7" r="1.1" fill="#C13584" />
    </svg>
  );
}
