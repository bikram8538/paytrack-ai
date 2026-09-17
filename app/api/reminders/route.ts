import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
export async function GET(request: NextRequest) {
  const session = await getSession(request); if (!session?.companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const logs = await prisma.reminderLog.findMany({ where: { invoice: { companyId: session.companyId } }, include: { invoice: { include: { customer: { select: { customerName: true } } } } }, orderBy: { createdAt: "desc" }, take: 200 });
  return NextResponse.json({ data: logs });
}
