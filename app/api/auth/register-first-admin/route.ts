// app/api/auth/register-first-admin/route.ts
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// OPTIONAL: if you have a clear default tenant
const DEFAULT_TENANT_ID = process.env.DEFAULT_TENANT_ID || null;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, name, password } = body ?? {};

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    // 1) Block if a super admin already exists
    const existingSuperAdmin = await prisma.user.findFirst({
      where: { role: "SUPER_ADMIN" as any },
    });

    if (existingSuperAdmin) {
      return NextResponse.json(
        { error: "A super admin already exists." },
        { status: 403 }
      );
    }

    // 2) Create Supabase Auth user first (this satisfies the users_id_fkey)
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
    const authUserId = authUser.id; // this is what your DB FK expects

    // 3) Hash password for your own app-level user record (optional but good)
    const passwordHash = await bcrypt.hash(password, 12);

    // 4) Create Prisma User row, using SAME id as Supabase auth user
    const user = await prisma.user.create({
      data: {
        id: authUserId, // <-- key line for satisfying `users_id_fkey`
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
  } catch (err: any) {
    console.error("register-first-admin error:", err);
    return NextResponse.json(
      { error: "Unexpected error creating first admin." },
      { status: 500 }
    );
  }
}
