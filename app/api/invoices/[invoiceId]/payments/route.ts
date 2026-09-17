import { NextRequest, NextResponse } from "next/server";
import { getSession, canManage } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { paymentSchema } from "@/lib/validators";
import { deriveInvoiceStatus } from "@/lib/invoice";
import { audit } from "@/lib/audit";

export async function POST(request: NextRequest, { params }: { params: Promise<{ invoiceId: string }> }) {
  const session = await getSession(request); if (!session?.companyId || !canManage(session)) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const { invoiceId } = await params;
  const parsed = paymentSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const invoice = await prisma.invoice.findFirst({ where: { id: invoiceId, companyId: session.companyId } });
  if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  if (parsed.data.amount > Number(invoice.dueAmount) + 0.01) return NextResponse.json({ error: "Payment exceeds outstanding balance." }, { status: 400 });
  const result = await prisma.$transaction(async tx => {
    const payment = await tx.paymentHistory.create({ data: { invoiceId, amount: parsed.data.amount, paymentMethod: parsed.data.paymentMethod, reference: parsed.data.reference || null, notes: parsed.data.notes || null } });
    const newPaid = Number(invoice.amountPaid) + parsed.data.amount;
    const newDue = Math.max(0, Number(invoice.invoiceAmount) - newPaid);
    const status = deriveInvoiceStatus({ amountPaid: newPaid, invoiceAmount: Number(invoice.invoiceAmount), dueDate: invoice.dueDate, currentStatus: invoice.status });
    const updated = await tx.invoice.update({ where: { id: invoiceId }, data: { amountPaid: newPaid, dueAmount: newDue, status } });
    return { payment, updated };
  });
  await audit({ companyId: session.companyId, userId: session.userId, action: "RECORD_PAYMENT", entity: "Invoice", entityId: invoiceId, metadata: { amount: parsed.data.amount, method: parsed.data.paymentMethod } });
  return NextResponse.json({ data: result }, { status: 201 });
}
