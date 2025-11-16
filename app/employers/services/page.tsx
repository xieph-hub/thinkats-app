// app/employers/services/page.tsx
// Thin wrapper so /employers/services still works,
// but all content lives at /services.

import type { Metadata } from "next";
import ServicesPage, { metadata } from "../../services/page";

export { metadata };
export default ServicesPage;
