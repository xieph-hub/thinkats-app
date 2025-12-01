// app/api/auth/register-first-admin/route.ts
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// Optional: set a default tenant if you want to bind the super admin
const DEFAULT_TENANT_ID = process.env.DEFAULT_TENANT_ID || null;

type ParsedBody = {
  email: string;
  name: string;
  password: string;
};

async function parseBody(req: Request): Promise<ParsedBody> {
  const contentType = req.headers.get("content-type") || "";

  // If called via fetch("/api/...", { body: JSON.stringify(...) })
  if (contentType.includes("application/json")) {
    const body = await req.json();
    return {
      email: (body.email || "").toString(),
      name: (body.name || "").toString(),
      password: (body.password || "").toString(),
    };
  }

  // If called via a normal HTML <form method="POST">
  const form = await req.formData();
  return {
    email: (form.get("email") || "").toString(),
    name: (form.get("name") || "").toString(),
    password: (form.get("password") || "").toString(),
  };
}

export async function POST(req: Request) {
  try {
    const { email, name, password } = await parseBody(req);

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    // 1) Block if a SUPER_ADMIN already exists
    const existingSuperAdmin = await prisma.user.findFirst({
      where: { role: "SUPER_ADMIN" as any },
    });

    if (existingSuperAdmin) {
      return NextResponse.json(
        { error: "A super admin already exists." },
        { status: 403 }
      );
    }

    // 2) Create Supabase Auth user first (this satisfies users_id_fkey)
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (error || !data?.user) {
      console.error("Supabase admin.createUser error:", error);
      return NextResponse.json(
        { error: "Failed to create auth user." },
        { status: 500 }
      );
    }

    const authUser = data.user;
    const authUserId = authUser.id; // this matches the foreign key constraint

    // 3) Hash password for your app-level User record
    const passwordHash = await bcrypt.hash(password, 12);

    // 4) Create Prisma User row using SAME id as Supabase auth user
    const user = await prisma.user.create({
      data: {
        id: authUserId, // <-- key line: this avoids P2003 `users_id_fkey`
        email,
        name,
        passwordHash,
        role: "SUPER_ADMIN" as any,
        tenantId: DEFAULT_TENANT_ID,
      },
    });

    return NextResponse.json(
      {
        success: true,
        userId: user.id,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("register-first-admin error:", err);
    return NextResponse.json(
      { error: "Unexpected error creating first admin." },
      { status: 500 }
    );
  }
}
