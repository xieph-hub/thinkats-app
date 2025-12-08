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
  const rawReturnTo = searchParams.returnTo;
  const returnTo =
    typeof rawReturnTo === "string" && rawReturnTo.trim()
      ? rawReturnTo
      : "/ats";

  const target = `/ats/verify?callbackUrl=${encodeURIComponent(returnTo)}`;
  redirect(target);
}
