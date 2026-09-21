import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { createSessionToken } from "@/lib/session";
import { getUserByEmail } from "@/lib/store";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!email || !password) {
      return NextResponse.json({ message: "Email and password are required." }, { status: 400 });
    }

    const user = await getUserByEmail(email);

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return NextResponse.json({ message: "Invalid email or password." }, { status: 401 });
    }

    const token = await createSessionToken({
      id: String(user._id || user.id),
      email: user.email,
      role: user.role || "admin",
    });

    const response = NextResponse.json({ success: true, user: { name: user.name, email: user.email, role: user.role } });
    response.cookies.set("session", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch {
    return NextResponse.json({ message: "Something went wrong while logging in." }, { status: 500 });
  }
}
