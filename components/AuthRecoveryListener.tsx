// components/AuthRecoveryListener.tsx
"use client";

import type { ReactNode } from "react";

type Props = {
  children?: ReactNode;
};

/**
 * No-op wrapper to keep the layout compiling.
 *
 * If app/layout.tsx uses:
 *   <AuthRecoveryListener>{children}</AuthRecoveryListener>
 * this will just pass them through.
 *
 * If it uses:
 *   <AuthRecoveryListener />
 * it will also render nothing and not crash.
 */
export default function AuthRecoveryListener({ children }: Props) {
  return <>{children}</>;
}
