import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

const secret = process.env.JWT_SECRET || "development-secret-change-me";
const key = new TextEncoder().encode(secret);

export type Session = { userId: string; companyId: string | null; role: string; name?: string; email?: string };

export async function signAccessToken(session: Session) {
  return new SignJWT(session)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30m")
    .sign(key);
}

export async function getSession(request: NextRequest): Promise<Session | null> {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || request.cookies.get("paytrack_token")?.value;
  return verifyToken(token);
}

export async function getServerSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  return verifyToken(cookieStore.get("paytrack_token")?.value);
}

export async function verifyToken(token?: string): Promise<Session | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key);
    return {
      userId: String(payload.userId),
      companyId: payload.companyId ? String(payload.companyId) : null,
      role: String(payload.role),
      name: payload.name ? String(payload.name) : undefined,
      email: payload.email ? String(payload.email) : undefined,
    };
  } catch {
    return null;
  }
}

export function assertRole(session: Session | null, roles: string[]) {
  return Boolean(session && roles.includes(session.role));
}

export function canManage(session: Session | null) {
  return assertRole(session, ["COMPANY_OWNER", "ACCOUNTANT"]);
}
