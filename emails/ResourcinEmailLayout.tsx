// emails/ResourcinEmailLayout.tsx
import * as React from "react";

type ResourcinEmailLayoutProps = {
  title: string;
  preheader?: string;
  children: React.ReactNode;
};

export default function ResourcinEmailLayout({
  title,
  preheader,
  children,
}: ResourcinEmailLayoutProps) {
  return (
    <div
      style={{
        margin: 0,
        padding: "24px 0",
        backgroundColor: "#F3F4F6",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
      }}
    >
      {/* Hidden preheader for inbox preview */}
      {preheader && (
        <div
          style={{
            display: "none",
            overflow: "hidden",
            lineHeight: "1px",
            maxHeight: "0px",
            maxWidth: "0px",
            opacity: 0,
          }}
        >
          {preheader}
        </div>
      )}

      <div
        style={{
          maxWidth: 640,
          margin: "0 auto",
          padding: "0 16px",
        }}
      >
        {/* Brand accent line */}
        <div
          style={{
            height: 4,
            borderRadius: 999,
            marginBottom: 16,
            backgroundImage:
              "linear-gradient(90deg, #172965 0%, #172965 55%, #64C247 85%, #FFC000 100%)",
          }}
        />

        {/* Main card */}
        <div
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: 18,
            border: "1px solid #E5E7EB",
            padding: 24,
            boxShadow:
              "0 20px 35px rgba(15, 23, 42, 0.10), 0 2px 4px rgba(15, 23, 42, 0.05)",
          }}
        >
          {/* Header */}
          <div style={{ marginBottom: 18 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "#6B7280",
              }}
            >
              RESOURCIN
            </div>
            <div
              style={{
                fontSize: 22,
                lineHeight: 1.3,
                fontWeight: 700,
                color: "#111827",
                marginTop: 6,
              }}
            >
              {title}
            </div>
            <div
              style={{
                marginTop: 4,
                fontSize: 12,
                color: "#6B7280",
              }}
            >
              Executive search &amp; recruitment for founders, leaders and
              hiring managers.
            </div>
          </div>

          {/* Email body content */}
          {children}

          {/* Footer banner (within the card) */}
          <div
            style={{
              marginTop: 24,
              borderRadius: 14,
              overflow: "hidden",
              backgroundColor: "#172965",
              border: "1px solid rgba(15,23,42,0.7)",
            }}
          >
            {/* Thin yellow/green strip on top */}
            <div
              style={{
                height: 3,
                backgroundImage:
                  "linear-gradient(90deg, #FFC000 0%, #64C247 40%, #172965 100%)",
              }}
            />

            <div
              style={{
                padding: "14px 16px 16px",
                color: "#E5E7EB",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: 12,
                }}
              >
                {/* Left: brand + tagline */}
                <div style={{ minWidth: 220 }}>
                  <div
                    style={{
                      fontSize: 13,
                      letterSpacing: "0.16em",
                      textTransform: "uppercase",
                      fontWeight: 700,
                      color: "#F9FAFB",
                    }}
                  >
                    RESOURCIN
                  </div>
                  <div
                    style={{
                      marginTop: 4,
                      fontSize: 12,
                      color: "#E5E7EB",
                    }}
                  >
                    Connecting Talent with Opportunity, Redefining Workplaces
                    and Careers.
                  </div>
                </div>

                {/* Right: contact + socials as text links */}
                <div
                  style={{
                    textAlign: "right",
                    fontSize: 11,
                    color: "#E5E7EB",
                    flex: 1,
                    minWidth: 200,
                  }}
                >
                  <div style={{ marginBottom: 4 }}>
                    Email:{" "}
                    <a
                      href="mailto:hello@resourcin.com"
                      style={{
                        color: "#F9FAFB",
                        textDecoration: "none",
                        fontWeight: 500,
                      }}
                    >
                      hello@resourcin.com
                    </a>
                  </div>
                  <div style={{ marginBottom: 4 }}>
                    Website:{" "}
                    <a
                      href="https://www.resourcin.com"
                      style={{
                        color: "#F9FAFB",
                        textDecoration: "none",
                        fontWeight: 500,
                      }}
                    >
                      resourcin.com
                    </a>
                  </div>
                  <div>
                    Follow us:{" "}
                    <a
                      href="https://www.linkedin.com/company/resourcin"
                      style={{
                        color: "#F9FAFB",
                        textDecoration: "none",
                        marginRight: 8,
                      }}
                    >
                      LinkedIn
                    </a>
                    <span style={{ opacity: 0.7, marginRight: 4 }}>/</span>
                    <a
                      href="https://x.com/resourcinhq"
                      style={{
                        color: "#F9FAFB",
                        textDecoration: "none",
                      }}
                    >
                      X
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Micro footer below card */}
        <div
          style={{
            textAlign: "center",
            marginTop: 10,
            fontSize: 10,
            color: "#9CA3AF",
          }}
        >
          You&apos;re receiving this update from Resourcin in connection with a
          hiring process.
        </div>
      </div>
    </div>
  );
}
