
import { NextResponse } from "next/server";

// Example stub: replace with your ATS integration later
export async function GET() {
  const sample = [
    { id: "gm-bd", title: "GM, Sales & Business Development", location: "Lagos/Hybrid", comp: "₦45m–₦65m + bonus", closes: "2025-12-15" },
    { id: "treasury-sales-manager", title: "Treasury Sales Manager", location: "Lagos", comp: "₦25m–₦35m + comm.", closes: "2025-11-30" },
    { id: "country-manager-ke", title: "Country Manager (Kenya)", location: "Nairobi", comp: "$60k–$90k + bonus", closes: "2026-01-10" },
  ];
  return NextResponse.json({ jobs: sample });
}
