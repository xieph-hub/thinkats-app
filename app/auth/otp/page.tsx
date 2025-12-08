// app/auth/otp/page.tsx
import { redirect } from "next/navigation";

type SearchParams = {
  [key: string]: string | string[] | undefined;
};

export default function LegacyOtpRedirectPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  // We receive ?returnTo=/ats (or something else) from the login flow
  const rawReturnTo = searchParams.returnTo;
  const returnTo =
    typeof rawReturnTo === "string" && rawReturnTo.trim()
      ? rawReturnTo
      : "/ats";

  const target = `/ats/verify?callbackUrl=${encodeURIComponent(returnTo)}`;

  // Immediately send the user into the canonical OTP screen
  redirect(target);
}
