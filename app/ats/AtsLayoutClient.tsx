"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { AppUserWithTenants } from "@/lib/auth/getServerUser";

type AtsLayoutClientProps = {
  user: AppUserWithTenants;
  isSuperAdmin: boolean;
  children: ReactNode;
};
