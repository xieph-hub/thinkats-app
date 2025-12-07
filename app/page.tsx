// app/page.tsx
import { redirect } from "next/navigation";
import { getHostContext } from "@/lib/host";

export default function HomePage() {
  const { isPrimaryHost, tenantSlugFromHost } = getHostContext();

  // 🟡 Tenant subdomain: make root feel like THEIR app, not ThinkATS marketing
  if (!isPrimaryHost && tenantSlugFromHost) {
    // You can later upgrade this to a proper tenant landing page,
    // but for now this makes root = "client's ATS page".
    redirect("/login");
  }

  // 🟢 Primary host (thinkats.com / www.thinkats.com):
  // keep your global behaviour here. If you previously redirected
  // to /careers or /jobs, keep that. Example:
  redirect("/jobs");
}
