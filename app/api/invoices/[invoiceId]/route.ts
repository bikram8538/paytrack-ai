import { NextRequest, NextResponse } from "next/server";
import { getSession, canManage } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { invoiceUpdateSchema } from "@/lib/validators";
import { audit } from "@/lib/audit";
import { deriveInvoiceStatus } from "@/lib/invoice";

export async function GET(request: NextRequest, { params }: { params: Promise<{ invoiceId: string }> }) {
  const session = await getSession(request); if (!session?.companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { invoiceId } = await params;
  const invoice = await prisma.invoice.findFirst({ where: { id: invoiceId, companyId: session.companyId }, include: { customer: true, paymentHistory: { orderBy: { paymentDate: "desc" } }, reminders: { orderBy: { createdAt: "desc" }, take: 50 }, paymentLinks: { orderBy: { createdAt: "desc" } } } });
  if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  return NextResponse.json({ data: { ...invoice, invoiceAmount: Number(invoice.invoiceAmount), amountPaid: Number(invoice.amountPaid), dueAmount: Number(invoice.dueAmount) } });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ invoiceId: string }> }) {
  const session = await getSession(request); if (!session?.companyId || !canManage(session)) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const { invoiceId } = await params;
  const parsed = invoiceUpdateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const current = await prisma.invoice.findFirst({ where: { id: invoiceId, companyId: session.companyId } });
  if (!current) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  const invoiceAmount = parsed.data.invoiceAmount ?? Number(current.invoiceAmount);
  const dueDate = parsed.data.dueDate ?? current.dueDate;
  const dueAmount = Math.max(0, invoiceAmount - Number(current.amountPaid));
  const derived = parsed.data.status ?? deriveInvoiceStatus({ amountPaid: Number(current.amountPaid), invoiceAmount, dueDate, currentStatus: current.status });
  const invoice = await prisma.invoice.update({ where: { id: invoiceId }, data: { invoiceAmount, dueDate, dueAmount, status: derived, notes: parsed.data.notes === undefined ? current.notes : (parsed.data.notes || null) } });
  await audit({ companyId: session.companyId, userId: session.userId, action: "UPDATE", entity: "Invoice", entityId: invoiceId });
  return NextResponse.json({ data: invoice });
}
