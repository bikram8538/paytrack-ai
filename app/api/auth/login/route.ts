import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { signAccessToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit, requestKey } from "@/lib/rate-limit";
import { audit } from "@/lib/audit";
import { loginSchema } from "@/lib/validators";

export async function POST(request: NextRequest) {
  const rl = rateLimit(`login:${requestKey(request)}`, 10, 10 * 60_000);
  if (!rl.ok) return NextResponse.json({ error: "Too many login attempts. Try again later." }, { status: 429 });
  const parsed = loginSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid credentials" }, { status: 400 });
  const user = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() }, include: { company: true } });
  if (!user?.password || !(await bcrypt.compare(parsed.data.password, user.password))) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  if (user.company?.isSuspended) return NextResponse.json({ error: "This workspace is suspended." }, { status: 403 });
  const token = await signAccessToken({ userId: user.id, companyId: user.companyId, role: user.role, name: user.name, email: user.email });
  const response = NextResponse.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role, company: user.company?.companyName } });
  response.cookies.set("paytrack_token", token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 60 * 30, path: "/" });
  if (user.companyId) await audit({ companyId: user.companyId, userId: user.id, action: "LOGIN", entity: "User", entityId: user.id });
  return response;
}
