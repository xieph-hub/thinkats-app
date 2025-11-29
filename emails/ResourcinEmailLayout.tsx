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
              Connecting Talent with Opportunity, Redefining Workplaces and
              Careers.
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
                  alignItems: "center",
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
                    Executive search &amp; recruitment for founders, leaders and
                    hiring managers.
                  </div>
                </div>

                {/* Right: icon-only contact + socials */}
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    justifyContent: "flex-end",
                    gap: 8,
                    flex: 1,
                  }}
                >
                  {/* Email icon */}
                  <FooterIconButton
                    href="mailto:hello@resourcin.com"
                    label="Email Resourcin"
                    type="mail"
                  />
                  {/* Website icon */}
                  <FooterIconButton
                    href="https://www.resourcin.com"
                    label="Visit resourcin.com"
                    type="globe"
                  />
                  {/* LinkedIn (same path as JobCard) */}
                  <FooterIconButton
                    href="https://www.linkedin.com/company/resourcin"
                    label="Resourcin on LinkedIn"
                    type="linkedin"
                  />
                  {/* X (same path as JobCard) */}
                  <FooterIconButton
                    href="https://x.com/resourcinhq"
                    label="Resourcin on X"
                    type="x"
                  />
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

// ---------------------------------------------------------------------------
// Footer icon button (email, site, LinkedIn, X) – all icon-only
// ---------------------------------------------------------------------------

type FooterIconType = "mail" | "globe" | "linkedin" | "x";

type FooterIconButtonProps = {
  href: string;
  label: string;
  type: FooterIconType;
};

function FooterIconButton({ href, label, type }: FooterIconButtonProps) {
  // Colour logic: contact icons = subtle navy, socials = brand colours
  const { bg, border } =
    type === "linkedin"
      ? { bg: "#0A66C2", border: "transparent" }
      : type === "x"
      ? { bg: "#111827", border: "transparent" }
      : {
          bg: "rgba(15,23,42,0.55)",
          border: "1px solid rgba(248,250,252,0.45)",
        };

  return (
    <a
      href={href}
      aria-label={label}
      style={{
        display: "inline-flex",
        width: 28,
        height: 28,
        borderRadius: 999,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: bg,
        border,
        textDecoration: "none",
      }}
    >
      {type === "mail" && <MailIcon />}
      {type === "globe" && <GlobeIcon />}
      {type === "linkedin" && <LinkedInSvg />}
      {type === "x" && <XSvg />}
    </a>
  );
}

function MailIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 20 20"
      aria-hidden="true"
      fill="none"
      style={{ display: "block" }}
    >
      <rect
        x="3"
        y="4"
        width="14"
        height="12"
        rx="2"
        stroke="#F9FAFB"
        strokeWidth="1.2"
      />
      <path
        d="M4 6.5 10 10l6-3.5"
        stroke="#F9FAFB"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 20 20"
      aria-hidden="true"
      fill="none"
      style={{ display: "block" }}
    >
      <circle
        cx="10"
        cy="10"
        r="6.2"
        stroke="#F9FAFB"
        strokeWidth="1.2"
      />
      <path
        d="M10 3.8c-1.5 1.7-2.3 3.9-2.3 6.2 0 2.3.8 4.5 2.3 6.2m0-12.4c1.5 1.7 2.3 3.9 2.3 6.2 0 2.3-.8 4.5-2.3 6.2M4.2 10h11.6"
        stroke="#F9FAFB"
        strokeWidth="1.1"
      />
    </svg>
  );
}

/**
 * LinkedIn icon – same path as JobCard LinkedInIcon,
 * just constrained for email (no Tailwind classes).
 */
function LinkedInSvg() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="#FFFFFF"
      style={{ display: "block" }}
    >
      <path d="M4.98 3.5C4.98 4.88 3.88 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1 4.98 2.12 4.98 3.5zM.22 8.25h4.56V24H.22zM8.34 8.25h4.37v2.13h.06c.61-1.16 2.1-2.38 4.32-2.38 4.62 0 5.47 3.04 5.47 6.99V24h-4.56v-7.22c0-1.72-.03-3.93-2.4-3.93-2.4 0-2.77 1.87-2.77 3.8V24H8.34z" />
    </svg>
  );
}

/**
 * X icon – same path as JobCard XIcon.
 */
function XSvg() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="#FFFFFF"
      style={{ display: "block" }}
    >
      <path d="M18.5 2h-3.1L12 7.2 8.8 2H2l6.7 10.1L2.4 22h3.1L12 14.7 16 22h6.8l-7-10.6L21.6 2h-3.1L14 8.4z" />
    </svg>
  );
}
