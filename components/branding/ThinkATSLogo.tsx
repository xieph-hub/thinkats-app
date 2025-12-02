// components/branding/ThinkATSLogo.tsx
import React from "react";
import clsx from "clsx";

const BRAND_COLORS = {
  blue: "#172965",
  yellow: "#FFC000",
  darkGreen: "#306B34",
  lightGreen: "#64C247",
};

type ThinkATSLogoVariant = "primary" | "mono" | "watermark";

interface ThinkATSLogoProps {
  /** "primary" (default), "mono", or "watermark" */
  variant?: ThinkATSLogoVariant;
  /** Used for mono + watermark variants */
  monoColor?: string;
  /** Optional tagline under the wordmark */
  showTagline?: boolean;
  /** Additional classes (e.g. w-40 h-auto) */
  className?: string;
}

export default function ThinkATSLogo({
  variant = "primary",
  monoColor = BRAND_COLORS.blue,
  showTagline = false,
  className,
}: ThinkATSLogoProps) {
  const isMono = variant !== "primary";

  const fillThink = isMono ? monoColor : BRAND_COLORS.blue;
  const fillATS = isMono ? monoColor : BRAND_COLORS.lightGreen;

  const opacity = variant === "watermark" ? 0.08 : 1;
  const fontSize = variant === "watermark" ? 48 : 24;

  return (
    <svg
      className={clsx("block", className)}
      viewBox="0 0 320 80"
      role="img"
      aria-label="ThinkATS logo"
    >
      <g style={{ opacity }}>
        <text
          x={0}
          y={40}
          fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
          fontWeight={600}
          fontSize={fontSize}
          letterSpacing="0.02em"
        >
          <tspan fill={fillThink}>Think</tspan>
          <tspan fill={fillATS}>ATS</tspan>
        </text>

        {showTagline && (
          <text
            x={0}
            y={40 + fontSize * 0.6 + 8}
            fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
            fontWeight={400}
            fontSize={fontSize * 0.42}
            fill={isMono ? monoColor : "#4B5563"}
          >
            Structured hiring, quietly powerful
          </text>
        )}
      </g>
    </svg>
  );
}
