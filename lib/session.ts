import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { redirect } from "next/navigation";

const encoder = new TextEncoder();
const JWT_SECRET = process.env.JWT_SECRET || "nexucon-local-secret";

export type SessionUser = {
  id: string;
  email: string;
  role: string;
};

export async function createSessionToken(user: SessionUser) {
  return new SignJWT({
    sub: user.id,
    email: user.email,
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(encoder.encode(JWT_SECRET));
}

export async function verifySessionToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, encoder.encode(JWT_SECRET));

    return {
      id: String(payload.sub || ""),
      email: String(payload.email || ""),
      role: String(payload.role || "admin"),
    } satisfies SessionUser;
  } catch {
    return null;
  }
}

export async function getSessionUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;

  if (!token) {
    return null;
  }

  return verifySessionToken(token);
}

export async function requireUserSession() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}
