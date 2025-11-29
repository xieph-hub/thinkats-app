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
              Executive search &amp; recruitment for founders, leaders and hiring
              managers.
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
            {/* Thin yellow strip on top */}
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
                    Sharper, faster and more honest hiring decisions across
                    Nigeria, Africa and beyond.
                  </div>
                </div>

                {/* Right: contact + socials */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-end",
                    gap: 8,
                    flex: 1,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      justifyContent: "flex-end",
                      gap: 8,
                    }}
                  >
                    <FooterPill
                      href="mailto:hello@resourcin.com"
                      label="hello@resourcin.com"
                      icon="mail"
                    />
                    <FooterPill
                      href="https://www.resourcin.com"
                      label="resourcin.com"
                      icon="globe"
                    />
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "flex-end",
                      gap: 8,
                      marginTop: 4,
                    }}
                  >
                    <SocialIcon
                      href="https://www.linkedin.com/company/resourcin"
                      label="LinkedIn"
                      type="linkedin"
                    />
                    <SocialIcon
                      href="https://x.com/resourcinhq"
                      label="X (Twitter)"
                      type="x"
                    />
                    <SocialIcon
                      href="https://api.whatsapp.com/send?text=Hello%20Resourcin"
                      label="WhatsApp"
                      type="whatsapp"
                    />
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

// ---------------------------------------------------------------------------
// Footer helper components
// ---------------------------------------------------------------------------

type FooterPillProps = {
  href: string;
  label: string;
  icon: "mail" | "globe";
};

function FooterPill({ href, label, icon }: FooterPillProps) {
  return (
    <a
      href={href}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 10px",
        borderRadius: 999,
        border: "1px solid rgba(243,244,246,0.8)",
        backgroundColor: "rgba(15,23,42,0.35)",
        textDecoration: "none",
        fontSize: 11,
        color: "#F9FAFB",
      }}
    >
      {icon === "mail" ? <MailIcon /> : <GlobeIcon />}
      <span>{label}</span>
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

// Social icons – shapes mirror the JobCard icons but adapted for email
type SocialType = "linkedin" | "x" | "whatsapp";

type SocialIconProps = {
  href: string;
  label: string;
  type: SocialType;
};

function SocialIcon({ href, label, type }: SocialIconProps) {
  const bgColor =
    type === "linkedin"
      ? "#0A66C2"
      : type === "x"
      ? "#111827"
      : "#25D366";

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
        backgroundColor: bgColor,
        textDecoration: "none",
      }}
    >
      {type === "linkedin" && <LinkedInSvg />}
      {type === "x" && <XSvg />}
      {type === "whatsapp" && <WhatsAppSvg />}
    </a>
  );
}

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

function WhatsAppSvg() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 32 32"
      aria-hidden="true"
      fill="#FFFFFF"
      style={{ display: "block" }}
    >
      <path d="M16.04 4C9.96 4 5 8.96 5 15.02c0 2.38.72 4.6 2.09 6.5L5 28l6.63-2.07c1.84 1 3.9 1.53 6.01 1.53h.01C22.1 27.46 27 22.5 27 16.44 27 10.38 22.12 4 16.04 4zm-.01 20.9c-1.8 0-3.56-.48-5.1-1.38l-.37-.22-3.93 1.23 1.28-3.84-.24-.39A8.7 8.7 0 0 1 7.3 15c0-4.84 3.93-8.78 8.77-8.78 4.77 0 8.66 3.94 8.66 8.78 0 4.83-3.9 8.9-8.66 8.9zm4.78-6.63c-.26-.13-1.53-.76-1.77-.84-.24-.09-.41-.13-.58.12-.17.26-.67.84-.82 1-.15.17-.3.19-.56.06-.26-.13-1.09-.4-2.08-1.28-.77-.69-1.29-1.54-1.44-1.8-.15-.26-.02-.4.11-.53.12-.12.26-.3.39-.45.13-.15.17-.26.26-.43.09-.17.04-.32-.02-.45-.06-.13-.58-1.39-.8-1.9-.21-.5-.42-.44-.58-.45l-.5-.01c-.17 0-.45.06-.69.32-.24.26-.9.88-.9 2.14 0 1.26.92 2.48 1.05 2.65.13.17 1.81 2.86 4.4 4.02.62.27 1.11.43 1.49.55.63.2 1.2.17 1.65.1.5-.08 1.53-.62 1.75-1.22.22-.6.22-1.11.15-1.22-.06-.11-.24-.17-.5-.3z" />
    </svg>
  );
}
