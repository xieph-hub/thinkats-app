// app/careers/page.tsx
import { redirect } from "next/navigation";

export default function CareersIndexRedirect() {
  redirect("/jobs");
}
