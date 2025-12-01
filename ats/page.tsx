// app/ats/page.tsx
import { redirect } from "next/navigation";

export default function AtsRootPage() {
  // Root of the ATS → dashboard
  redirect("/ats/dashboard");
}
