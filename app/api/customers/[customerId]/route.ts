import { NextRequest, NextResponse } from "next/server";
import { getSession, canManage } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { customerSchema } from "@/lib/validators";
import { audit } from "@/lib/audit";

export async function GET(request: NextRequest, { params }: { params: Promise<{ customerId: string }> }) {
  const session = await getSession(request); if (!session?.companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { customerId } = await params;
  const customer = await prisma.customer.findFirst({ where: { id: customerId, companyId: session.companyId }, include: { invoices: { orderBy: { dueDate: "desc" }, take: 20 } } });
  if (!customer) return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  return NextResponse.json({ data: customer });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ customerId: string }> }) {
  const session = await getSession(request); if (!session?.companyId || !canManage(session)) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const { customerId } = await params;
  const parsed = customerSchema.partial().safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const exists = await prisma.customer.findFirst({ where: { id: customerId, companyId: session.companyId } });
  if (!exists) return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  const customer = await prisma.customer.update({ where: { id: customerId }, data: { ...parsed.data, email: parsed.data.email === "" ? null : parsed.data.email, gstNumber: parsed.data.gstNumber === "" ? null : parsed.data.gstNumber, address: parsed.data.address === "" ? null : parsed.data.address } });
  await audit({ companyId: session.companyId, userId: session.userId, action: "UPDATE", entity: "Customer", entityId: customerId });
  return NextResponse.json({ data: customer });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ customerId: string }> }) {
  const session = await getSession(request); if (!session?.companyId || !canManage(session)) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const { customerId } = await params;
  const invoiceCount = await prisma.invoice.count({ where: { customerId, companyId: session.companyId } });
  if (invoiceCount) return NextResponse.json({ error: "Customer has invoices and cannot be deleted." }, { status: 409 });
  await prisma.customer.deleteMany({ where: { id: customerId, companyId: session.companyId } });
  await audit({ companyId: session.companyId, userId: session.userId, action: "DELETE", entity: "Customer", entityId: customerId });
  return NextResponse.json({ ok: true });
}
