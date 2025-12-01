// app/contact/page.tsx
import type { Metadata } from "next";
import ContactClient from "./ContactClient";

export const metadata: Metadata = {
  title: "Contact | ThinkATS",
  description:
    "Talk to the ThinkATS team about your hiring workflows, ATS pipelines, and career sites.",
};

export default function ContactPage() {
  return <ContactClient />;
}
