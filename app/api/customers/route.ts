import { NextRequest, NextResponse } from "next/server";
import { getSession, canManage } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { customerSchema } from "@/lib/validators";
import { audit } from "@/lib/audit";

export async function GET(request: NextRequest) {
  const session = await getSession(request);
  if (!session?.companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const search = request.nextUrl.searchParams.get("q") || "";
  const customers = await prisma.customer.findMany({ where: { companyId: session.companyId, ...(search ? { OR: [{ customerName: { contains: search, mode: "insensitive" } }, { mobile: { contains: search } }, { email: { contains: search, mode: "insensitive" } }] } : {}) }, include: { _count: { select: { invoices: true } } }, orderBy: { createdAt: "desc" }, take: 200 });
  return NextResponse.json({ data: customers });
}

export async function POST(request: NextRequest) {
  const session = await getSession(request);
  if (!session?.companyId || !canManage(session)) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const parsed = customerSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const customer = await prisma.customer.create({ data: { ...parsed.data, email: parsed.data.email || null, gstNumber: parsed.data.gstNumber || null, address: parsed.data.address || null, companyId: session.companyId } });
  await audit({ companyId: session.companyId, userId: session.userId, action: "CREATE", entity: "Customer", entityId: customer.id });
  return NextResponse.json({ data: customer }, { status: 201 });
}
