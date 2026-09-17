import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signAccessToken } from "@/lib/auth";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const companyName = typeof body?.companyName === "string" ? body.companyName.trim() : "";
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  if (companyName.length < 2 || name.length < 2 || !/^\S+@\S+\.\S+$/.test(email) || password.length < 8) return NextResponse.json({ error: "Please provide a company name, name, valid email, and password of at least 8 characters." }, { status: 400 });
  if (await prisma.user.findUnique({ where: { email } })) return NextResponse.json({ error: "Email already registered." }, { status: 409 });
  if (await prisma.company.findUnique({ where: { email } })) return NextResponse.json({ error: "A workspace already exists for this email." }, { status: 409 });
  const hash = await bcrypt.hash(password, 12);
  const result = await prisma.$transaction(async tx => {
    const company = await tx.company.create({ data: { companyName, email, phone: "", subscriptionPlan: "STARTER" } });
    const user = await tx.user.create({ data: { name, email, password: hash, role: "COMPANY_OWNER", companyId: company.id } });
    await tx.subscription.create({ data: { companyId: company.id, plan: "STARTER", amount: 0, expiryDate: new Date(Date.now() + 14 * 86400000) } });
    await tx.automationRule.createMany({ data: [
      { companyId: company.id, name: "1 day after due — WhatsApp", trigger: "AFTER_DUE", offsetDays: 1, channel: "WHATSAPP", enabled: true },
      { companyId: company.id, name: "3 days after due — Email", trigger: "AFTER_DUE", offsetDays: 3, channel: "EMAIL", enabled: true },
    ] });
    return { company, user };
  });
  const token = await signAccessToken({ userId: result.user.id, companyId: result.company.id, role: result.user.role, name: result.user.name, email: result.user.email });
  const response = NextResponse.json({ user: { id: result.user.id, name: result.user.name, email: result.user.email }, company: result.company }, { status: 201 });
  response.cookies.set("paytrack_token", token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 60 * 30, path: "/" });
  return response;
}
