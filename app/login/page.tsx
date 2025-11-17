// app/login/page.tsx
import type { Metadata } from "next";
import LoginClient from "./LoginClient";

export const metadata: Metadata = {
  title: "Login | Resourcin",
  description:
    "Secure access for candidates and clients to view profiles, searches and applications.",
};

export default function LoginPage() {
  return <LoginClient />;
}
