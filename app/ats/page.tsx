// app/ats/page.tsx
import { redirect } from "next/navigation";

export default function AtsIndexPage() {
  // Single responsibility: treat /ats as an alias for the ATS dashboard.
  // This keeps URLs sane and decouples jobs from the root.
  redirect("/ats/dashboard");
}
