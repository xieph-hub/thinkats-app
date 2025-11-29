// emails/CandidateApplicationReceived.tsx
import * as React from "react";

export type CandidateApplicationReceivedProps = {
  candidateName: string;
  jobTitle: string;
  jobPublicUrl: string;
  candidateEmail: string;
  source?: string;
};

const containerStyle: React.CSSProperties = {
  backgroundColor: "#f3f4f6",
  padding: "24px 0",
};

const outerWrapperStyle: React.CSSProperties = {
  maxWidth: "600px",
  margin: "0 auto",
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
};

const cardStyle: React.CSSProperties = {
  backgroundColor: "#ffffff",
  borderRadius: 16,
  border: "1px solid #e5e7eb",
  padding: "24px 24px 20px",
};

const headerKickerStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: "0.16em",
  textTransform: "uppercase",
  color: "#6b7280",
};

const headerTitleStyle: React.CSSProperties = {
  fontSize: 20,
  lineHeight: 1.3,
  fontWeight: 700,
  color: "#111827",
  marginTop: 4,
};

const bodyTextStyle: React.CSSProperties = {
  fontSize: 14,
  lineHeight: 1.6,
  color: "#374151",
};

const detailBoxStyle: React.CSSProperties = {
  marginTop: 16,
  padding: "12px 14px",
  borderRadius: 10,
  backgroundColor: "#f9fafb",
  border: "1px solid #e5e7eb",
  fontSize: 13,
  color: "#4b5563",
};

const detailLabelStyle: React.CSSProperties = {
  fontWeight: 600,
  color: "#111827",
};

const footerWrapperStyle: React.CSSProperties = {
  textAlign: "center",
  marginTop: 12,
  fontSize: 12,
  color: "#6b7280",
};

const footerBrandStyle: React.CSSProperties = {
  marginBottom: 4,
};

const footerLinkRowStyle: React.CSSProperties = {
  marginBottom: 6,
};

const inlineIconLinkRowStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 10,
  justifyContent: "center",
};

const footerAnchorStyle: React.CSSProperties = {
  color: "#172965",
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
};

const iconWrapperStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};

const subtleMutedStyle: React.CSSProperties = {
  fontSize: 11,
  color: "#9ca3af",
  marginTop: 14,
};

export default function CandidateApplicationReceived({
  candidateName,
  jobTitle,
  jobPublicUrl,
  candidateEmail,
  source,
}: CandidateApplicationReceivedProps) {
  const safeName = candidateName?.trim() || "there";

  const preheaderText =
    "We’ve received your application. Our recruitment team will review your profile and contact you if there’s a close fit.";

  return (
    <div style={containerStyle}>
      {/* Preheader (hidden in most clients but improves preview text) */}
      <span
        style={{
          display: "none",
          fontSize: 0,
          lineHeight: 0,
          maxHeight: 0,
          maxWidth: 0,
          opacity: 0,
          overflow: "hidden",
        }}
      >
        {preheaderText}
      </span>

      <div style={outerWrapperStyle}>
        <div style={cardStyle}>
          {/* Header */}
          <div style={{ marginBottom: 16 }}>
            <div style={headerKickerStyle}>RESOURCIN</div>
            <div style={headerTitleStyle}>Application received</div>
          </div>

          {/* Body */}
          <div style={bodyTextStyle}>
            <p style={{ margin: "0 0 12px 0" }}>Hi {safeName},</p>
            <p style={{ margin: "0 0 12px 0" }}>
              Thank you for applying for the{" "}
              <strong>{jobTitle}</strong> role via Resourcin.
            </p>
            <p style={{ margin: "0 0 12px 0" }}>
              We’ve received your application and our recruitment team will
              review it carefully. If your profile is a close match for the
              role, we&apos;ll reach out to discuss next steps.
            </p>
          </div>

          {/* Role + meta */}
          <div style={detailBoxStyle}>
            <div style={{ marginBottom: 4 }}>
              <span style={detailLabelStyle}>Role:</span>{" "}
              <a
                href={jobPublicUrl}
                style={{ color: "#172965", textDecoration: "none" }}
              >
                {jobTitle}
              </a>
            </div>
            <div style={{ marginBottom: 4 }}>
              <span style={detailLabelStyle}>Submitted with:</span>{" "}
              <span>{candidateEmail}</span>
            </div>
            {source && (
              <div style={{ marginBottom: 2 }}>
                <span style={detailLabelStyle}>Application source:</span>{" "}
                <span>{source}</span>
              </div>
            )}
          </div>

          {/* Sign-off */}
          <p
            style={{
              marginTop: 18,
              marginBottom: 0,
              fontSize: 13,
              color: "#4b5563",
            }}
          >
            Best regards,
            <br />
            Resourcin Recruitment Team
            <br />
            <span style={{ fontSize: 12, color: "#6b7280" }}>
              Executive search &amp; recruitment
            </span>
          </p>
        </div>

        {/* Footer / signature-style block */}
        <div style={footerWrapperStyle}>
          <div style={footerBrandStyle}>
            Resourcin · Executive search &amp; recruitment
          </div>

          {/* Website row */}
          <div style={footerLinkRowStyle}>
            <a
              href="https://www.resourcin.com"
              style={footerAnchorStyle}
              target="_blank"
              rel="noreferrer"
            >
              <span style={iconWrapperStyle}>
                <GlobeIcon />
              </span>
              <span>resourcin.com</span>
            </a>
          </div>

          {/* Social icons row */}
          <div style={inlineIconLinkRowStyle}>
            <a
              href="https://www.linkedin.com/company/resourcin"
              style={footerAnchorStyle}
              target="_blank"
              rel="noreferrer"
            >
              <span style={iconWrapperStyle}>
                <LinkedInIcon />
              </span>
              <span>LinkedIn</span>
            </a>

            <a
              href="https://x.com/resourcinhq"
              style={footerAnchorStyle}
              target="_blank"
              rel="noreferrer"
            >
              <span style={iconWrapperStyle}>
                <XIcon />
              </span>
              <span>X</span>
            </a>

            <a
              href="https://www.instagram.com/resourcinhq/"
              style={footerAnchorStyle}
              target="_blank"
              rel="noreferrer"
            >
              <span style={iconWrapperStyle}>
                <InstagramIcon />
              </span>
              <span>Instagram</span>
            </a>
          </div>

          <div style={subtleMutedStyle}>
            You&apos;re receiving this because you applied for a role via
            Resourcin.
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Icons – styled to be consistent with the icon style used on /jobs pages    */
/* -------------------------------------------------------------------------- */

function GlobeIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 20 20"
      aria-hidden="true"
      fill="none"
    >
      <circle
        cx="10"
        cy="10"
        r="6.2"
        stroke="#4b5563"
        strokeWidth="1.2"
      />
      <path
        d="M10 3.8c-1.5 1.7-2.3 3.9-2.3 6.2 0 2.3.8 4.5 2.3 6.2m0-12.4c1.5 1.7 2.3 3.9 2.3 6.2 0 2.3-.8 4.5-2.3 6.2M4.2 10h11.6"
        stroke="#4b5563"
        strokeWidth="1.1"
      />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="#0A66C2"
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
      fill="#111827"
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
      fill="none"
    >
      <rect
        x="2.5"
        y="2.5"
        width="19"
        height="19"
        rx="5"
        stroke="#4b5563"
        strokeWidth="1.4"
      />
      <circle
        cx="12"
        cy="12"
        r="4"
        stroke="#4b5563"
        strokeWidth="1.4"
      />
      <circle cx="17.4" cy="6.6" r="1.1" fill="#4b5563" />
    </svg>
  );
}
