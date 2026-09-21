import { NextResponse } from "next/server";

import { requireUserSession } from "@/lib/session";
import { createUserRecord } from "@/lib/store";

export async function POST(request: Request) {
  await requireUserSession();

  const formData = await request.formData();
  const name = String(formData.get("name") || "");
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");
  const role = String(formData.get("role") || "editor");

  if (!name || !email || !password) {
    return NextResponse.json({ message: "Name, email and password are required." }, { status: 400 });
  }

  await createUserRecord({ name, email, password, role });

  return NextResponse.redirect(new URL("/admin", process.env.APP_URL || "http://localhost:3000"));
}
