// app/api/auth/register-first-admin/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type ParsedBody = {
  email: string;
  name: string;
  password: string;
};

async function parseBody(req: Request): Promise<ParsedBody> {
  const contentType = req.headers.get("content-type") || "";

  // JSON body (fetch with application/json)
  if (contentType.includes("application/json")) {
    const body = await req.json();
    return {
      email: (body.email || "").toString(),
      name: (body.name || "").toString(),
      password: (body.password || "").toString(),
    };
  }

  // Fallback: regular <form method="POST">
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

    // 1) Block if ANY user already exists (first user == first admin conceptually)
    const existingUser = await prisma.user.findFirst();
    if (existingUser) {
      return NextResponse.json(
        { error: "An admin/user already exists." },
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
    const authUserId = authUser.id; // this is what the FK expects

    // 3) Create Prisma User row using SAME id as Supabase auth user.
    //    We only include fields that are very likely to exist; casting as any
    //    so Prisma TS types don't complain if your model shape is different.
    const user = await prisma.user.create({
      data: {
        id: authUserId,
        email,
        name,
      } as any,
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
