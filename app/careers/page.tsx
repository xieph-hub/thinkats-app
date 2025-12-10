// app/careers/page.tsx
import { redirect } from "next/navigation";

/**
 * Legacy /careers route.
 * We don't use "careers" anymore – everything is under /jobs.
 * Any hit to /careers just goes straight to /jobs on the same host.
 */
export default function CareersLegacyPage() {
  redirect("/jobs");
}
