// app/ats/page.tsx
import { redirect } from "next/navigation";

export default function AtsRootPage() {
  // Once you're in the ATS area, always land on the dashboard.
  redirect("/ats/dashboard");
}
