// emails/_BaseResourcinEmailLayout.tsx
import * as React from "react";

type BaseResourcinEmailLayoutProps = {
  children: React.ReactNode;
  title?: string;
  previewText?: string;
};

export default function BaseResourcinEmailLayout({
  children,
  title,
  previewText,
}: BaseResourcinEmailLayoutProps) {
  return (
    <div style={{ backgroundColor: "#f3f4f6", padding: "24px 0" }}>
      {/* Hidden preview text for inbox snippet */}
      {previewText ? (
        <div
          style={{
            display: "none",
            fontSize: "1px",
            color: "#f3f4f6",
            lineHeight: "1px",
            maxHeight: "0px",
            maxWidth: "0px",
            opacity: 0,
            overflow: "hidden",
          }}
        >
          {previewText}
        </div>
      ) : null}

      <div
        style={{
          maxWidth: "560px",
          margin: "0 auto",
          fontFamily:
            "-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif",
        }}
      >
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "12px",
            border: "1px solid #e5e7eb",
            padding: "24px 24px 18px",
          }}
        >
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
            {title ? (
              <div
                style={{
                  fontSize: "20px",
                  lineHeight: 1.3,
                  fontWeight: 700,
                  color: "#111827",
                  marginTop: "4px",
                }}
              >
                {title}
              </div>
            ) : null}
          </div>

          <div style={{ fontSize: "14px", lineHeight: 1.6, color: "#374151" }}>
            {children}
          </div>
        </div>

        <div
          style={{
            textAlign: "center",
            marginTop: "10px",
            fontSize: "12px",
            color: "#6b7280",
          }}
        >
          <div style={{ marginBottom: "4px" }}>
            Resourcin · Executive search & recruitment
          </div>
          <div style={{ marginBottom: "4px" }}>
            <a
              href="https://www.resourcin.com"
              style={{ color: "#172965", textDecoration: "none" }}
            >
              resourcin.com
            </a>
          </div>
          <div>
            <span style={{ marginRight: "4px" }}>Follow us:</span>
            <a
              href="https://www.linkedin.com/company/resourcin"
              style={{
                color: "#172965",
                textDecoration: "none",
                marginRight: "8px",
              }}
            >
              LinkedIn
            </a>
            <a
              href="https://x.com/resourcinhq"
              style={{
                color: "#172965",
                textDecoration: "none",
                marginRight: "8px",
              }}
            >
              X
            </a>
            <a
              href="https://www.instagram.com/resourcinhq/"
              style={{ color: "#172965", textDecoration: "none" }}
            >
              Instagram
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
