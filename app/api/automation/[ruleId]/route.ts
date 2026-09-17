import { NextRequest, NextResponse } from "next/server";
import { getSession, canManage } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { automationSchema } from "@/lib/validators";
import { audit } from "@/lib/audit";
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ ruleId: string }> }) {
  const session = await getSession(request); if (!session?.companyId || !canManage(session)) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const { ruleId } = await params; const parsed = automationSchema.partial().safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const exists = await prisma.automationRule.findFirst({ where: { id: ruleId, companyId: session.companyId } }); if (!exists) return NextResponse.json({ error: "Rule not found" }, { status: 404 });
  const rule = await prisma.automationRule.update({ where: { id: ruleId }, data: parsed.data });
  await audit({ companyId: session.companyId, userId: session.userId, action: "UPDATE", entity: "AutomationRule", entityId: ruleId });
  return NextResponse.json({ data: rule });
}
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ ruleId: string }> }) {
  const session = await getSession(request); if (!session?.companyId || !canManage(session)) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const { ruleId } = await params; await prisma.automationRule.deleteMany({ where: { id: ruleId, companyId: session.companyId } });
  await audit({ companyId: session.companyId, userId: session.userId, action: "DELETE", entity: "AutomationRule", entityId: ruleId });
  return NextResponse.json({ ok: true });
}
