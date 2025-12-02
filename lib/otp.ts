// lib/otp.ts
import crypto from "crypto";

export function generateOtpCode(): string {
  // 6 digit code like 482193
  const code = Math.floor(100000 + Math.random() * 900000);
  return String(code);
}

export function hashOtpCode(code: string): string {
  return crypto.createHash("sha256").update(code).digest("hex");
}
