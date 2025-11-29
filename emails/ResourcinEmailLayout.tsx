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
      {/* Hidden preheader text for inbox preview */}
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

      <div style={{ maxWidth: 600, margin: "0 auto", padding: "0 16px" }}>
        {/* Brand accent line */}
        <div
          style={{
            height: 4,
            borderRadius: 999,
            marginBottom: 16,
            backgroundImage:
              "linear-gradient(90deg, #172965 0%, #172965 40%, #64C247 100%)",
          }}
        />

        {/* Main card */}
        <div
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: 16,
            border: "1px solid #E5E7EB",
            padding: 24,
            boxShadow:
              "0 18px 30px rgba(15, 23, 42, 0.08), 0 2px 4px rgba(15, 23, 42, 0.04)",
          }}
        >
          {/* Header block */}
          <div style={{ marginBottom: 16 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.18em",
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
                fontSize: 12,
                color: "#6B7280",
                marginTop: 4,
              }}
            >
              Executive search &amp; recruitment for founders, leaders and
              hiring managers.
            </div>
          </div>

          {children}
        </div>

        {/* Footer / signature */}
        <div
          style={{
            textAlign: "center",
            fontSize: 12,
            color: "#6B7280",
            marginTop: 12,
            paddingBottom: 4,
          }}
        >
          <div style={{ marginBottom: 4 }}>
            Resourcin · Executive search &amp; recruitment
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              flexWrap: "wrap",
              gap: 8,
              marginBottom: 8,
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
              justifyContent: "center",
              gap: 8,
              marginTop: 2,
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
              href="https://www.instagram.com/resourcinhq/"
              label="Instagram"
              type="instagram"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// -- footer pills (email / website) -----------------------------------------

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
        border: "1px solid #E5E7EB",
        backgroundColor: "#F9FAFB",
        textDecoration: "none",
        fontSize: 11,
        color: "#111827",
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
      style={{ display: "block" }}
      fill="none"
    >
      <rect
        x="3"
        y="4"
        width="14"
        height="12"
        rx="2"
        stroke="#4B5563"
        strokeWidth="1.2"
      />
      <path
        d="M4 6.5 10 10l6-3.5"
        stroke="#4B5563"
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
      style={{ display: "block" }}
      fill="none"
    >
      <circle
        cx="10"
        cy="10"
        r="6.2"
        stroke="#4B5563"
        strokeWidth="1.2"
      />
      <path
        d="M10 3.8c-1.5 1.7-2.3 3.9-2.3 6.2 0 2.3.8 4.5 2.3 6.2m0-12.4c1.5 1.7 2.3 3.9 2.3 6.2 0 2.3-.8 4.5-2.3 6.2M4.2 10h11.6"
        stroke="#4B5563"
        strokeWidth="1.1"
      />
    </svg>
  );
}

// -- social icons (styled similar to /jobs icons) ---------------------------

type SocialIconProps = {
  href: string;
  label: string;
  type: "linkedin" | "x" | "instagram";
};

function SocialIcon({ href, label, type }: SocialIconProps) {
  const bg =
    type === "linkedin"
      ? "#0A66C2"
      : type === "x"
      ? "#111827"
      : "#DB2777"; // instagram-ish accent

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
        textDecoration: "none",
      }}
    >
      {type === "linkedin" && <LinkedInIcon />}
      {type === "x" && <XIcon />}
      {type === "instagram" && <InstagramIcon />}
    </a>
  );
}

function LinkedInIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      aria-hidden="true"
      style={{ display: "block" }}
      fill="#ffffff"
    >
      <path d="M4.98 3.5C4.98 4.88 3.88 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1 4.98 2.12 4.98 3.5zM.22 8.25h4.56V24H.22zM8.34 8.25h4.37v2.13h.06c.61-1.16 2.1-2.38 4.32-2.38 4.62 0 5.47 3.04 5.47 6.99V24h-4.56v-7.22c0-1.72-.03-3.93-2.4-3.93-2.4 0-2.77 1.87-2.77 3.8V24H8.34z" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      aria-hidden="true"
      style={{ display: "block" }}
      fill="#ffffff"
    >
      <path d="M18.5 2h-3.1L12 7.2 8.8 2H2l6.7 10.1L2.4 22h3.1L12 14.7 16 22h6.8l-7-10.6L21.6 2h-3.1L14 8.4z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      aria-hidden="true"
      style={{ display: "block" }}
      fill="none"
    >
      <rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="5"
        stroke="#ffffff"
        strokeWidth="1.6"
      />
      <circle cx="12" cy="12" r="4.2" stroke="#ffffff" strokeWidth="1.6" />
      <circle cx="17.2" cy="6.8" r="1.2" fill="#ffffff" />
    </svg>
  );
}
