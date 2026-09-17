import { NextRequest, NextResponse } from "next/server";
import { getSession, canManage } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { automationSchema } from "@/lib/validators";
import { audit } from "@/lib/audit";

export async function GET(request: NextRequest) {
  const session = await getSession(request); if (!session?.companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rules = await prisma.automationRule.findMany({ where: { companyId: session.companyId }, orderBy: { createdAt: "asc" } });
  return NextResponse.json({ data: rules });
}
export async function POST(request: NextRequest) {
  const session = await getSession(request); if (!session?.companyId || !canManage(session)) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const parsed = automationSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const rule = await prisma.automationRule.create({ data: { ...parsed.data, template: parsed.data.template || null, companyId: session.companyId } });
  await audit({ companyId: session.companyId, userId: session.userId, action: "CREATE", entity: "AutomationRule", entityId: rule.id });
  return NextResponse.json({ data: rule }, { status: 201 });
}
