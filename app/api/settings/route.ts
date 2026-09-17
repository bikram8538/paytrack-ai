import { NextRequest, NextResponse } from "next/server";
import { getSession, canManage } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/audit";
const schema = { companyName: (v: unknown) => typeof v === "string" && v.trim().length >= 2, phone: (v: unknown) => typeof v === "string" && v.trim().length >= 8, address: (v: unknown) => typeof v === "string" };
export async function GET(request: NextRequest) {
  const session = await getSession(request); if (!session?.companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const company = await prisma.company.findUnique({ where: { id: session.companyId }, include: { subscriptions: { orderBy: { createdAt: "desc" }, take: 1 }, integrations: true } });
  return NextResponse.json({ data: company });
}
export async function PATCH(request: NextRequest) {
  const session = await getSession(request); if (!session?.companyId || !canManage(session)) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const body = await request.json().catch(() => null); if (!body || !schema.companyName(body.companyName) || !schema.phone(body.phone)) return NextResponse.json({ error: "Invalid company data" }, { status: 400 });
  const company = await prisma.company.update({ where: { id: session.companyId }, data: { companyName: body.companyName.trim(), phone: body.phone.trim(), address: typeof body.address === "string" ? body.address.trim() || null : null, timezone: typeof body.timezone === "string" ? body.timezone : undefined } });
  await audit({ companyId: session.companyId, userId: session.userId, action: "UPDATE", entity: "Company", entityId: session.companyId });
  return NextResponse.json({ data: company });
}
